// ===================================================================
// /api/game/[id]
//   GET  → renvoie l'état filtré (la main des autres joueurs masquée)
//   POST → applique une action (join, addBot, start, bid, playCard, ...)
// ===================================================================

import { withGame, getGame } from '../../lib/store.js';
import {
  buildDeck, shuffle, sortHand,
  getPlayableCards, resolveTrick, computeTreasureBonus,
  calculateScore, botChooseBid, botChooseCard, botChooseTigressMode,
} from '../../public/engine.js';
import { randomUUID } from 'node:crypto';

const BOT_NAMES = ['Barbe Noire', 'Anne Bonny', 'Calico Jack', 'Mary Read',
                   'Long John', 'Capitaine Crochet', 'Davy Jones'];

// ============================================================
// GET — vue filtrée pour un client
// ============================================================
function buildView(game, playerToken) {
  const isHost = playerToken && playerToken === game.hostToken;
  const me = game.players.find(p => p.id === playerToken);

  const view = {
    id: game.id,
    status: game.status,
    options: game.options,
    players: game.players.map(p => ({
      id: p.id === me?.id ? p.id : `player_${game.players.indexOf(p)}`,
      name: p.name,
      isBot: p.isBot,
      connected: p.connected,
      isMe: p.id === me?.id,
      isHost: game.hostToken === p.id, // hostToken correspond à l'un des players via joindure ? non — voir plus bas
    })),
    isHost,
    isPlayer: !!me,
    log: game.log.slice(-30),
    version: game.version,
  };

  // hostToken n'est pas un id de joueur ; on marque l'hôte par convention :
  // le premier joueur de la liste est l'hôte (créateur).
  view.players.forEach((p, i) => p.isHost = (i === 0));

  if (game.round) {
    view.round = {
      num: game.round.num,
      totalRounds: game.options.totalRounds,
      dealerIdx: game.round.dealerIdx,
      currentTrick: game.round.currentTrick,
      activePlayerIdx: game.round.activePlayerIdx,
      bids: game.round.bidsRevealed ? game.round.bids : maskedBids(game),
      tricksWon: game.round.tricksWon,
      lastTrick: game.round.lastTrick,
      cumulativeScores: game.round.cumulativeScores,
      handCounts: game.players.map(p => (game.round.hands[p.id] || []).length),
    };
    if (me) {
      view.round.myHand = game.round.hands[me.id] ? sortHand(game.round.hands[me.id]) : [];
      view.round.myBid = game.round.bids[me.id] ?? null;
    }
  }

  if (game.status === 'roundEnd' || game.status === 'finished') {
    view.lastRoundResult = game.roundResults[game.roundResults.length - 1] || null;
    view.allRoundResults = game.roundResults;
  }

  if (game.status === 'finished') {
    view.finalRanking = game.players
      .map(p => ({ name: p.name, score: totalScore(p, game) }))
      .sort((a, b) => b.score - a.score);
  }

  return view;
}

function maskedBids(game) {
  // Pendant la phase de paris, on ne révèle pas les paris des autres
  const out = {};
  for (const p of game.players) {
    out[p.id] = (game.round.bids[p.id] !== undefined) ? '?' : null;
  }
  return out;
}

function totalScore(player, game) {
  let total = 0;
  for (const r of game.roundResults) {
    if (r.scores[player.id]) total += r.scores[player.id].total;
  }
  return total;
}

// ============================================================
// ACTIONS
// ============================================================
function logEvent(game, text) {
  game.log.push({ ts: Date.now(), text });
  if (game.log.length > 200) game.log = game.log.slice(-200);
}

function bumpVersion(game) {
  game.version = (game.version || 0) + 1;
}

// --- Lobby --- /
function actionJoin(game, body) {
  if (game.status !== 'lobby') return { error: 'game_started' };
  if (game.players.length >= 8) return { error: 'full' };
  const name = (body.name || 'Joueur').toString().slice(0, 14);
  if (game.players.some(p => !p.isBot && p.name === name)) return { error: 'name_taken' };
  const playerToken = randomUUID();
  game.players.push({
    id: playerToken, name, isBot: false, connected: true, joinedAt: Date.now(),
  });
  logEvent(game, `${name} a rejoint la partie.`);
  bumpVersion(game);
  return { ok: true, playerToken };
}

function actionAddBot(game, hostToken) {
  if (hostToken !== game.hostToken) return { error: 'not_host' };
  if (game.status !== 'lobby') return { error: 'game_started' };
  if (game.players.length >= 8) return { error: 'full' };
  const usedNames = new Set(game.players.map(p => p.name));
  const name = BOT_NAMES.find(n => !usedNames.has(n)) || `Bot ${game.players.length}`;
  game.players.push({
    id: 'bot_' + randomUUID(), name, isBot: true, connected: true, joinedAt: Date.now(),
  });
  logEvent(game, `${name} (bot) a rejoint la partie.`);
  bumpVersion(game);
  return { ok: true };
}

function actionRemovePlayer(game, hostToken, body) {
  if (hostToken !== game.hostToken) return { error: 'not_host' };
  if (game.status !== 'lobby') return { error: 'game_started' };
  const idx = game.players.findIndex(p => p.id === body.targetId);
  if (idx <= 0) return { error: 'not_found' }; // hôte = idx 0 = non kickable
  const removed = game.players.splice(idx, 1)[0];
  logEvent(game, `${removed.name} a été retiré de la partie.`);
  bumpVersion(game);
  return { ok: true };
}

function actionUpdateOptions(game, hostToken, body) {
  if (hostToken !== game.hostToken) return { error: 'not_host' };
  if (game.status !== 'lobby') return { error: 'game_started' };
  if (typeof body.totalRounds === 'number') {
    game.options.totalRounds = Math.max(1, Math.min(10, body.totalRounds | 0));
  }
  if (typeof body.kraken === 'boolean') game.options.kraken = body.kraken;
  if (typeof body.whale  === 'boolean') game.options.whale  = body.whale;
  bumpVersion(game);
  return { ok: true };
}

function actionStart(game, hostToken) {
  if (hostToken !== game.hostToken) return { error: 'not_host' };
  if (game.status !== 'lobby') return { error: 'already_started' };
  if (game.players.length < 2) return { error: 'not_enough_players' };

  // Cap les manches selon le nombre de joueurs
  const deckSize = buildDeck(game.options).length;
  const maxRounds = Math.floor(deckSize / game.players.length);
  game.options.totalRounds = Math.min(game.options.totalRounds, maxRounds);

  startRound(game, 1, 0);
  logEvent(game, `La partie commence — ${game.options.totalRounds} manches.`);
  bumpVersion(game);
  return { ok: true };
}

// --- Round lifecycle --- /
function startRound(game, num, dealerIdx) {
  const fresh = shuffle(buildDeck(game.options));
  const hands = {};
  for (const p of game.players) hands[p.id] = [];
  const remaining = fresh.slice();
  for (let c = 0; c < num; c++) {
    for (const p of game.players) {
      const card = remaining.pop();
      if (card) hands[p.id].push(card);
    }
  }
  const bids = {};
  const tricksWon = {};
  const trickPlays = {};
  for (const p of game.players) {
    bids[p.id] = undefined;
    tricksWon[p.id] = [];
    trickPlays[p.id] = 0;
  }
  const cumulative = {};
  for (const p of game.players) {
    cumulative[p.id] = totalScore(p, game);
  }
  game.round = {
    num,
    dealerIdx,
    startingIdx: (dealerIdx + 1) % game.players.length,
    hands,
    undealt: remaining,
    bids,
    bidsRevealed: false,
    tricksWon,
    bonusThisRound: Object.fromEntries(game.players.map(p => [p.id, 0])),
    currentTrick: { plays: [], leadIdx: (dealerIdx + 1) % game.players.length },
    activePlayerIdx: (dealerIdx + 1) % game.players.length,
    lastTrick: null,
    cumulativeScores: cumulative,
  };
  game.status = 'bidding';
  // Les bots placent leur pari instantanément
  for (let i = 0; i < game.players.length; i++) {
    const p = game.players[i];
    if (p.isBot) {
      game.round.bids[p.id] = botChooseBid(hands[p.id], num);
    }
  }
  // Si tous les joueurs sont bots OU ont déjà parié, passer en jeu
  maybeStartPlaying(game);
}

function maybeStartPlaying(game) {
  if (game.status !== 'bidding') return;
  const allBid = game.players.every(p => game.round.bids[p.id] !== undefined);
  if (allBid) {
    game.round.bidsRevealed = true;
    game.status = 'playing';
    logEvent(game, `Manche ${game.round.num} : tous les paris sont placés.`);
    advanceBots(game);
  }
}

function actionBid(game, playerToken, body) {
  if (game.status !== 'bidding') return { error: 'not_bidding' };
  const player = game.players.find(p => p.id === playerToken);
  if (!player) return { error: 'unknown_player' };
  if (game.round.bids[player.id] !== undefined) return { error: 'already_bid' };
  const bid = body.bid | 0;
  if (bid < 0 || bid > game.round.num) return { error: 'invalid_bid' };
  game.round.bids[player.id] = bid;
  logEvent(game, `${player.name} a placé son pari.`);
  bumpVersion(game);
  maybeStartPlaying(game);
  return { ok: true };
}

function actionPlayCard(game, playerToken, body) {
  if (game.status !== 'playing') return { error: 'not_playing' };
  const idx = game.players.findIndex(p => p.id === playerToken);
  if (idx === -1) return { error: 'unknown_player' };
  if (idx !== game.round.activePlayerIdx) return { error: 'not_your_turn' };
  const player = game.players[idx];
  const hand = game.round.hands[player.id];
  const card = hand.find(c => c.id === body.cardId);
  if (!card) return { error: 'card_not_in_hand' };

  const playable = getPlayableCards(hand, game.round.currentTrick.plays);
  if (!playable.some(c => c.id === card.id)) return { error: 'illegal_play' };

  // Tigresse → mode obligatoire
  if (card.type === 'tigress') {
    const mode = body.tigressMode;
    if (mode !== 'pirate' && mode !== 'escape') return { error: 'tigress_mode_required' };
    card.mode = mode;
  }

  applyPlay(game, player, card);
  bumpVersion(game);
  advanceBots(game);
  return { ok: true };
}

function applyPlay(game, player, card) {
  const hand = game.round.hands[player.id];
  game.round.hands[player.id] = hand.filter(c => c.id !== card.id);
  game.round.currentTrick.plays.push({ playerId: player.id, card });

  // Tour suivant
  if (game.round.currentTrick.plays.length < game.players.length) {
    game.round.activePlayerIdx = (game.round.activePlayerIdx + 1) % game.players.length;
    return;
  }

  // Pli complet → résoudre
  resolveAndAdvance(game);
}

function resolveAndAdvance(game) {
  const trick = game.round.currentTrick;
  const result = resolveTrick(trick.plays);
  let nextLeadIdx;

  if (result.cancelled) {
    const winnerName = result.virtualWinnerId !== undefined
      ? game.players.find(p => p.id === result.virtualWinnerId).name
      : game.players[trick.leadIdx].name;
    const txt = result.info === 'Baleine (vide)'
      ? `🐋 Baleine engloutit le pli, ${winnerName} mène le suivant.`
      : `🐙 Kraken dévore le pli ! ${winnerName} mène le suivant.`;
    logEvent(game, txt);
    game.round.lastTrick = { plays: trick.plays, cancelled: true, info: txt };
    game.round.tricksWon[result.virtualWinnerId ?? game.players[trick.leadIdx].id].push({
      plays: trick.plays, cancelled: true,
    });
    nextLeadIdx = result.virtualWinnerId !== undefined
      ? game.players.findIndex(p => p.id === result.virtualWinnerId)
      : trick.leadIdx;
  } else {
    const winner = game.players.find(p => p.id === result.winnerId);
    game.round.tricksWon[winner.id].push({
      plays: trick.plays, winnerId: winner.id, cancelled: false,
    });
    game.round.bonusThisRound[winner.id] += (result.bonus || 0);
    let txt = `🏁 ${winner.name} remporte le pli`;
    if (result.bonus) txt += ` (bonus +${result.bonus})`;
    logEvent(game, txt + '.');
    game.round.lastTrick = { plays: trick.plays, cancelled: false, winnerId: winner.id, info: txt };
    nextLeadIdx = game.players.findIndex(p => p.id === winner.id);
  }

  const allEmpty = game.players.every(p => game.round.hands[p.id].length === 0);
  if (allEmpty) {
    endRound(game);
    return;
  }
  game.round.currentTrick = { plays: [], leadIdx: nextLeadIdx };
  game.round.activePlayerIdx = nextLeadIdx;
}

function endRound(game) {
  const breakdowns = {};
  for (const p of game.players) {
    const tricksWon = game.round.tricksWon[p.id] || [];
    const wins = tricksWon.filter(t => !t.cancelled);
    const tricksCount = wins.length;
    const treasure = computeTreasureBonus(wins);
    const playerSnapshot = {
      bid: game.round.bids[p.id],
      tricks: tricksCount,
      bonusThisRound: game.round.bonusThisRound[p.id],
      treasureBonus: treasure,
    };
    const sc = calculateScore(playerSnapshot, game.round.num);
    breakdowns[p.id] = {
      bid: playerSnapshot.bid,
      tricks: tricksCount,
      base: sc.base,
      bonus: sc.bonus,
      total: sc.total,
    };
  }
  game.roundResults.push({
    round: game.round.num,
    scores: breakdowns,
  });
  logEvent(game, `Manche ${game.round.num} terminée.`);
  game.status = 'roundEnd';
  bumpVersion(game);
}

function actionNextRound(game, hostToken) {
  if (hostToken !== game.hostToken) return { error: 'not_host' };
  if (game.status !== 'roundEnd') return { error: 'not_round_end' };
  const nextNum = game.round.num + 1;
  if (nextNum > game.options.totalRounds) {
    game.status = 'finished';
    game.round = null;
    logEvent(game, `🏆 Partie terminée !`);
    bumpVersion(game);
    return { ok: true };
  }
  const nextDealer = (game.round.dealerIdx + 1) % game.players.length;
  startRound(game, nextNum, nextDealer);
  bumpVersion(game);
  return { ok: true };
}

// ============================================================
// BOT ORCHESTRATION (synchrone)
// ============================================================
function advanceBots(game) {
  let safety = 200;
  while (safety-- > 0) {
    if (game.status !== 'playing') return;
    const idx = game.round.activePlayerIdx;
    const player = game.players[idx];
    if (!player.isBot) return;
    const hand = game.round.hands[player.id];
    const card = botChooseCard(
      hand,
      game.round.currentTrick.plays,
      game.round.bids[player.id],
      game.round.tricksWon[player.id].filter(t => !t.cancelled).length,
    );
    if (card.type === 'tigress') {
      card.mode = botChooseTigressMode(
        game.round.bids[player.id],
        game.round.tricksWon[player.id].filter(t => !t.cancelled).length,
      );
    }
    applyPlay(game, player, card);
  }
}

// ============================================================
// HANDLER
// ============================================================
export default async function handler(req, res) {
  const id = req.query.id;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'missing_id' });
    return;
  }
  const gameId = id.toUpperCase();

  if (req.method === 'GET') {
    const game = await getGame(gameId);
    if (!game) { res.status(404).json({ error: 'not_found' }); return; }
    const playerToken = req.query.token || req.headers['x-player-token'];
    res.status(200).json(buildView(game, playerToken));
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const action = body.action;
  const playerToken = body.playerToken || req.headers['x-player-token'];
  const hostToken = body.hostToken || req.headers['x-host-token'];

  const result = await withGame(gameId, (game) => {
    switch (action) {
      case 'join':          return actionJoin(game, body);
      case 'addBot':        return actionAddBot(game, hostToken);
      case 'removePlayer':  return actionRemovePlayer(game, hostToken, body);
      case 'updateOptions': return actionUpdateOptions(game, hostToken, body);
      case 'start':         return actionStart(game, hostToken);
      case 'bid':           return actionBid(game, playerToken, body);
      case 'playCard':      return actionPlayCard(game, playerToken, body);
      case 'nextRound':     return actionNextRound(game, hostToken);
      default:              return { error: 'unknown_action' };
    }
  });

  if (result.error === 'not_found') { res.status(404).json({ error: 'not_found' }); return; }
  if (result.error) { res.status(400).json({ error: result.error }); return; }

  // Pour join, on renvoie le playerToken au nouveau joueur
  const game = result.game;
  const view = buildView(game, body.action === 'join' ? result.playerToken || playerToken : playerToken);
  const payload = { ok: true, view };
  if (body.action === 'join') payload.playerToken = result.playerToken;
  res.status(200).json(payload);
}
