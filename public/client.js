// ===================================================================
// SKULL KING — Client (front-end)
// Communique avec /api/* via polling (1.5s) et rend la vue serveur.
// ===================================================================

import { SVG, SUIT_PIP, SUIT_LABEL } from './svg.js';
import { sortHand } from './engine.js';

// ============================================================
// CONSTANTES
// ============================================================
const POLL_INTERVAL_MS = 1500;

const SPECIAL_LABELS = {
  pirate: 'Pirate',
  skullking: 'Skull King',
  mermaid: 'Sirène',
  escape: 'Évasion',
  tigress: 'Tigresse',
  kraken: 'Kraken',
  whitewhale: 'Baleine Blanche',
};

// ============================================================
// NETWORK CLIENT
// ============================================================
class NetClient {
  constructor() {
    this.gameId = null;
    this.playerToken = null;
    this.hostToken = null;
    this.lastVersion = -1;
    this.pollTimer = null;
    this.onView = null;
    this.onError = null;
  }

  storageKey(suffix) {
    return `sk:${this.gameId}:${suffix}`;
  }

  loadTokens(gameId) {
    this.gameId = gameId;
    this.playerToken = localStorage.getItem(`sk:${gameId}:playerToken`) || null;
    this.hostToken = localStorage.getItem(`sk:${gameId}:hostToken`) || null;
  }

  saveTokens() {
    if (this.playerToken) localStorage.setItem(this.storageKey('playerToken'), this.playerToken);
    if (this.hostToken) localStorage.setItem(this.storageKey('hostToken'), this.hostToken);
  }

  clearTokens() {
    if (!this.gameId) return;
    localStorage.removeItem(this.storageKey('playerToken'));
    localStorage.removeItem(this.storageKey('hostToken'));
  }

  async createGame(name) {
    const res = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('create_failed');
    const data = await res.json();
    this.gameId = data.gameId;
    this.playerToken = data.playerToken;
    this.hostToken = data.hostToken;
    this.saveTokens();
    return data;
  }

  async joinGame(gameId, name) {
    this.gameId = gameId.toUpperCase();
    const res = await fetch(`/api/game/${this.gameId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'join_failed');
    }
    const data = await res.json();
    this.playerToken = data.playerToken;
    this.saveTokens();
    return data;
  }

  async fetchView() {
    if (!this.gameId) return null;
    const params = new URLSearchParams();
    if (this.playerToken) params.set('token', this.playerToken);
    const res = await fetch(`/api/game/${this.gameId}?${params}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error('not_found');
      throw new Error('fetch_failed');
    }
    return res.json();
  }

  async action(name, body = {}) {
    const res = await fetch(`/api/game/${this.gameId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.playerToken ? { 'x-player-token': this.playerToken } : {}),
        ...(this.hostToken ? { 'x-host-token': this.hostToken } : {}),
      },
      body: JSON.stringify({ action: name, ...body }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'action_failed');
    }
    return res.json();
  }

  startPolling() {
    if (this.pollTimer) return;
    const tick = async () => {
      try {
        const view = await this.fetchView();
        if (view && view.version !== this.lastVersion) {
          this.lastVersion = view.version;
          if (this.onView) this.onView(view);
        }
      } catch (e) {
        if (this.onError) this.onError(e);
      }
    };
    tick();
    this.pollTimer = setInterval(tick, POLL_INTERVAL_MS);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.lastVersion = -1;
  }
}

// ============================================================
// CARD RENDERING
// ============================================================
function cardClasses(card) {
  const classes = ['card'];
  if (card.type === 'number') {
    classes.push(`suit-${card.suit}`);
  } else {
    classes.push(`special-${card.type}`);
  }
  return classes;
}

function renderCardHtml(card, opts = {}) {
  const classes = cardClasses(card);
  if (opts.large) classes.push('large');
  if (opts.playable) classes.push('playable');
  if (opts.disabled) classes.push('disabled');
  if (opts.inTrick) classes.push('in-trick');
  if (opts.winner) classes.push('winner-glow');

  let cornerHtml = '';
  let artHtml = '';
  let labelText = '';

  if (card.type === 'number') {
    const pip = SUIT_PIP[card.suit] || '';
    cornerHtml = `
      <span class="corner top-left"><span class="rank">${card.value}</span><span class="pip">${pip}</span></span>
      <span class="corner bottom-right"><span class="rank">${card.value}</span><span class="pip">${pip}</span></span>
    `;
    artHtml = SVG[card.suit] || '';
    labelText = SUIT_LABEL[card.suit] || '';
  } else {
    artHtml = SVG[card.type] || '';
    labelText = SPECIAL_LABELS[card.type] || '';
    if (card.type === 'tigress' && card.mode) {
      labelText = card.mode === 'pirate' ? 'Tigresse → Pirate' : 'Tigresse → Évasion';
    }
  }

  return `
    <div class="${classes.join(' ')}" data-card-id="${card.id}">
      ${cornerHtml}
      <div class="art">${artHtml}</div>
      <div class="label">${labelText}</div>
    </div>
  `;
}

// ============================================================
// APP STATE
// ============================================================
const app = {
  net: new NetClient(),
  view: null,
  pendingTigress: null, // {cardId} en attente de choix
};

// ============================================================
// SCREENS
// ============================================================
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`${name}-screen`);
  if (el) el.classList.add('active');
}

function setHomeError(msg) {
  document.getElementById('home-error').textContent = msg || '';
}

function setLobbyError(msg) {
  document.getElementById('lobby-error').textContent = msg || '';
}

// ============================================================
// HOME SCREEN
// ============================================================
function bindHomeScreen() {
  const nameInput = document.getElementById('player-name');
  const joinInput = document.getElementById('join-id');

  // Pre-fill name from localStorage
  const savedName = localStorage.getItem('sk:lastName');
  if (savedName) nameInput.value = savedName;

  document.getElementById('btn-create').addEventListener('click', async () => {
    const name = nameInput.value.trim() || 'Capitaine';
    localStorage.setItem('sk:lastName', name);
    setHomeError('');
    try {
      const data = await app.net.createGame(name);
      updateUrl(data.gameId);
      enterGame(data.gameId);
    } catch (e) {
      setHomeError("Impossible de créer la partie.");
    }
  });

  document.getElementById('btn-join').addEventListener('click', async () => {
    const name = nameInput.value.trim() || 'Capitaine';
    const id = joinInput.value.trim().toUpperCase();
    if (!id) { setHomeError('Entrez un code de partie.'); return; }
    localStorage.setItem('sk:lastName', name);
    setHomeError('');
    try {
      app.net.loadTokens(id);
      // Si on a déjà un token pour cette partie, on tente la reprise sans rejoin
      if (app.net.playerToken) {
        try {
          const view = await app.net.fetchView();
          if (view && view.players.some(p => p.isMe)) {
            enterGame(id);
            return;
          }
        } catch {}
        // token périmé : on l'efface et on tente un join propre
        app.net.clearTokens();
        app.net.playerToken = null;
        app.net.hostToken = null;
      }
      await app.net.joinGame(id, name);
      updateUrl(id);
      enterGame(id);
    } catch (e) {
      const map = {
        not_found: "Cette partie n'existe pas (ou a expiré).",
        full: 'Partie complète (8 joueurs max).',
        name_taken: 'Ce nom est déjà pris dans cette partie.',
        game_started: 'La partie a déjà commencé.',
      };
      setHomeError(map[e.message] || 'Impossible de rejoindre.');
    }
  });

  joinInput.addEventListener('input', () => {
    joinInput.value = joinInput.value.toUpperCase();
  });
}

// ============================================================
// LOBBY
// ============================================================
function bindLobby() {
  document.getElementById('btn-copy-link').addEventListener('click', async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      document.getElementById('lobby-share-hint').textContent = '✅ Lien copié !';
      setTimeout(() => {
        document.getElementById('lobby-share-hint').textContent =
          "Partagez le lien ci-dessus avec vos amis pour qu'ils rejoignent.";
      }, 2000);
    } catch {
      setLobbyError('Copie impossible — sélectionnez le code manuellement.');
    }
  });

  document.getElementById('btn-add-bot').addEventListener('click', async () => {
    setLobbyError('');
    try { await app.net.action('addBot'); }
    catch (e) { setLobbyError("Ajout du bot impossible."); }
  });

  document.getElementById('btn-start').addEventListener('click', async () => {
    setLobbyError('');
    try { await app.net.action('start'); }
    catch (e) {
      const map = { not_enough_players: 'Il faut au moins 2 joueurs.' };
      setLobbyError(map[e.message] || 'Impossible de lancer la partie.');
    }
  });

  document.getElementById('btn-leave-lobby').addEventListener('click', () => {
    leaveGame();
  });

  ['opt-rounds', 'opt-kraken', 'opt-whale'].forEach(id => {
    document.getElementById(id).addEventListener('change', async () => {
      const totalRounds = parseInt(document.getElementById('opt-rounds').value, 10);
      const kraken = document.getElementById('opt-kraken').checked;
      const whale = document.getElementById('opt-whale').checked;
      try { await app.net.action('updateOptions', { totalRounds, kraken, whale }); }
      catch {}
    });
  });
}

function renderLobby(view) {
  document.getElementById('lobby-game-id').textContent = view.id;
  document.getElementById('lobby-player-count').textContent = view.players.length;

  const list = document.getElementById('lobby-players');
  list.innerHTML = view.players.map(p => {
    const badges = [];
    if (p.isHost) badges.push('<span class="badge host">Hôte</span>');
    if (p.isBot) badges.push('<span class="badge bot">Bot</span>');
    if (p.isMe) badges.push('<span class="badge me">Vous</span>');
    const kickBtn = (view.isHost && !p.isHost)
      ? `<button class="ghost small" data-kick="${p.id}">Retirer</button>`
      : '';
    return `<li>
      <span>${escapeHtml(p.name)} ${badges.join(' ')}</span>
      ${kickBtn}
    </li>`;
  }).join('');

  list.querySelectorAll('[data-kick]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-kick');
      try { await app.net.action('removePlayer', { targetId }); } catch {}
    });
  });

  // Host controls
  const hostControls = document.getElementById('lobby-host-controls');
  if (view.isHost) {
    hostControls.style.display = '';
    document.getElementById('opt-rounds').value = String(view.options.totalRounds);
    document.getElementById('opt-kraken').checked = !!view.options.kraken;
    document.getElementById('opt-whale').checked = !!view.options.whale;
  } else {
    hostControls.style.display = 'none';
  }
}

// ============================================================
// GAME SCREEN
// ============================================================
function bindGameScreen() {
  document.getElementById('btn-quit').addEventListener('click', () => {
    if (confirm('Quitter la partie ?')) leaveGame();
  });

  // Tigress modal
  document.querySelectorAll('#tigress-modal [data-tigress]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mode = btn.getAttribute('data-tigress');
      const cardId = app.pendingTigress;
      app.pendingTigress = null;
      hideModal('tigress-modal');
      if (cardId !== null) {
        try { await app.net.action('playCard', { cardId, tigressMode: mode }); }
        catch (e) { /* ignore */ }
      }
    });
  });

  // Round modal
  document.getElementById('btn-next-round').addEventListener('click', async () => {
    try { await app.net.action('nextRound'); } catch {}
  });

  // End modal
  document.getElementById('btn-end-newgame').addEventListener('click', () => {
    leaveGame();
  });
}

function renderGame(view) {
  // Topbar
  document.getElementById('game-code').textContent = view.id;
  document.getElementById('round-num').textContent = view.round?.num ?? '-';
  document.getElementById('round-total').textContent = view.options.totalRounds;
  document.getElementById('phase-label').textContent = phaseLabel(view.status);

  const me = view.players.find(p => p.isMe);
  const activeIdx = view.round?.activePlayerIdx;
  const activePlayer = (activeIdx !== undefined && activeIdx !== null)
    ? view.players[activeIdx] : null;
  document.getElementById('active-player').textContent =
    view.status === 'bidding' ? '— (paris)' :
    view.status === 'playing' && activePlayer ? activePlayer.name :
    view.status === 'roundEnd' ? '— (fin de manche)' :
    view.status === 'finished' ? '— (terminé)' : '-';

  renderOpponents(view, me);
  renderTrickArea(view);
  renderPlayerZone(view, me);
  renderScoreTable(view);
  renderLog(view);

  // Modals
  if (view.status === 'roundEnd') {
    showRoundEndModal(view);
  } else {
    hideModal('round-modal');
  }

  if (view.status === 'finished') {
    showEndModal(view);
  } else {
    hideModal('end-modal');
  }
}

function phaseLabel(status) {
  return {
    lobby: 'Lobby',
    bidding: 'Paris',
    playing: 'Jeu',
    roundEnd: 'Fin de manche',
    finished: 'Terminée',
  }[status] || status;
}

function renderOpponents(view, me) {
  const area = document.getElementById('opponents-area');
  if (!view.round) { area.innerHTML = ''; return; }

  const opponents = view.players.filter(p => !p.isMe);
  area.innerHTML = opponents.map((p, i) => {
    const playerIdx = view.players.indexOf(p);
    const isActive = view.status === 'playing' && view.round.activePlayerIdx === playerIdx;
    const handCount = view.round.handCounts[playerIdx] || 0;
    const bid = view.round.bids[p.id];
    const tricks = (view.round.tricksWon[p.id] || []).filter(t => !t.cancelled).length;
    const score = view.round.cumulativeScores[p.id] || 0;

    const cardsBack = Array.from({ length: handCount })
      .map(() => '<span class="mini-card"></span>').join('');

    const badges = [];
    if (p.isBot) badges.push('<span class="badge">BOT</span>');
    if (!p.connected) badges.push('<span class="badge">⚪</span>');

    const bidDisplay = bid === undefined || bid === null ? '—'
      : bid === '?' ? '?' : bid;

    return `
      <div class="bot ${isActive ? 'active' : ''} ${!p.connected ? 'disconnected' : ''}">
        <div class="name">${escapeHtml(p.name)} ${badges.join('')}</div>
        <div class="stats">Pari ${bidDisplay} · Plis ${tricks} · Score ${score}</div>
        <div class="cards-back">${cardsBack}</div>
      </div>
    `;
  }).join('');
}

function renderTrickArea(view) {
  const trickInfo = document.getElementById('trick-info');
  const trickCards = document.getElementById('trick-cards');
  const lastTrick = document.getElementById('last-trick');

  if (!view.round) {
    trickInfo.textContent = view.status === 'lobby' ? 'En attente du lancement...' : '';
    trickCards.innerHTML = '';
    lastTrick.textContent = '';
    return;
  }

  if (view.status === 'bidding') {
    trickInfo.textContent = '🤫 Phase de paris — choisissez vos plis';
  } else if (view.status === 'playing') {
    const playsCount = view.round.currentTrick.plays.length;
    trickInfo.textContent = playsCount === 0
      ? `Pli ${view.round.tricksWon ? trickIndex(view) : 1} — à ${view.players[view.round.activePlayerIdx]?.name} de jouer`
      : `Pli en cours (${playsCount}/${view.players.length})`;
  } else if (view.status === 'roundEnd') {
    trickInfo.textContent = `Manche ${view.round.num} terminée`;
  }

  const plays = view.round.currentTrick.plays || [];
  trickCards.innerHTML = plays.map(play => {
    const player = view.players.find(p => p.id === play.playerId);
    const name = player ? player.name : '?';
    return `
      <div class="card-wrap">
        ${renderCardHtml(play.card, { inTrick: true })}
        <div class="player-tag">${escapeHtml(name)}</div>
      </div>
    `;
  }).join('');

  // Last trick info
  if (view.round.lastTrick) {
    lastTrick.textContent = view.round.lastTrick.info || '';
  } else {
    lastTrick.textContent = '';
  }
}

function trickIndex(view) {
  let total = 0;
  for (const pid in view.round.tricksWon) {
    total += view.round.tricksWon[pid].length;
  }
  return total + 1;
}

function renderPlayerZone(view, me) {
  if (!me || !view.round) {
    document.getElementById('player-hand').innerHTML = '';
    document.getElementById('bid-bar').classList.add('hidden');
    document.getElementById('player-bid').textContent = '-';
    document.getElementById('player-tricks').textContent = '0';
    document.getElementById('player-label').textContent = me ? me.name : 'Vous';
    return;
  }

  document.getElementById('player-label').textContent = me.name;

  const myBid = view.round.myBid;
  document.getElementById('player-bid').textContent =
    myBid === null || myBid === undefined ? '—' : myBid;
  const myTricks = (view.round.tricksWon[me.id] || []).filter(t => !t.cancelled).length;
  document.getElementById('player-tricks').textContent = myTricks;

  // Bid bar
  const bidBar = document.getElementById('bid-bar');
  const isBidding = view.status === 'bidding' && (myBid === null || myBid === undefined);
  if (isBidding) {
    bidBar.classList.remove('hidden');
    const max = view.round.num;
    const opts = document.getElementById('bid-bar-options');
    opts.innerHTML = Array.from({ length: max + 1 }, (_, n) =>
      `<button data-bid="${n}">${n}</button>`).join('');
    opts.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bid = parseInt(btn.getAttribute('data-bid'), 10);
        try { await app.net.action('bid', { bid }); }
        catch (e) { /* ignore */ }
      });
    });
  } else {
    bidBar.classList.add('hidden');
  }

  // Hand
  const handEl = document.getElementById('player-hand');
  if (isBidding) handEl.classList.add('hand-large');
  else handEl.classList.remove('hand-large');

  const myHand = view.round.myHand || [];
  const isMyTurn = view.status === 'playing'
    && view.players[view.round.activePlayerIdx]?.id === me.id;

  // playable computed client-side from view rules
  const playable = isMyTurn ? clientPlayable(myHand, view.round.currentTrick.plays) : [];
  const playableSet = new Set(playable.map(c => c.id));

  handEl.innerHTML = myHand.map(card => {
    const isPlayable = isMyTurn && playableSet.has(card.id);
    const isDisabled = isMyTurn && !isPlayable;
    return renderCardHtml(card, {
      large: isBidding,
      playable: isPlayable,
      disabled: isDisabled,
    });
  }).join('');

  if (isMyTurn) {
    handEl.querySelectorAll('.card.playable').forEach(el => {
      el.addEventListener('click', () => onCardClick(el.getAttribute('data-card-id'), myHand));
    });
  }
}

function clientPlayable(hand, plays) {
  // Mirror engine.getPlayableCards for UI hints (server is authoritative)
  let leadFixed = false;
  let lead = null;
  for (const p of plays) {
    if (p.card.type === 'escape') continue;
    if (p.card.type === 'tigress' && p.card.mode === 'escape') continue;
    if (p.card.type === 'number') { lead = p.card.suit; leadFixed = true; break; }
    leadFixed = false; break;
  }
  if (!leadFixed || lead === null) return hand.slice();
  const sameSuit = hand.filter(c => c.type === 'number' && c.suit === lead);
  if (sameSuit.length === 0) return hand.slice();
  return hand.filter(c => c.type !== 'number' || c.suit === lead);
}

function onCardClick(cardIdStr, hand) {
  const cardId = parseInt(cardIdStr, 10);
  const card = hand.find(c => c.id === cardId);
  if (!card) return;
  if (card.type === 'tigress') {
    app.pendingTigress = cardId;
    showModal('tigress-modal');
    return;
  }
  app.net.action('playCard', { cardId }).catch(() => {});
}

function renderScoreTable(view) {
  const tbody = document.querySelector('#score-table tbody');
  const me = view.players.find(p => p.isMe);
  tbody.innerHTML = view.players.map(p => {
    const bid = view.round ? view.round.bids[p.id] : '—';
    const tricks = view.round
      ? (view.round.tricksWon[p.id] || []).filter(t => !t.cancelled).length
      : '—';
    const score = view.round
      ? view.round.cumulativeScores[p.id]
      : (view.allRoundResults || []).reduce(
          (s, r) => s + (r.scores[p.id]?.total || 0), 0);
    const cls = score > 0 ? 'pos-score' : score < 0 ? 'neg-score' : '';
    const isMe = me && p.id === me.id;
    const bidDisplay = bid === undefined || bid === null ? '—' : bid;
    return `
      <tr class="${isMe ? 'current-player' : ''}">
        <td>${escapeHtml(p.name)}</td>
        <td>${bidDisplay}</td>
        <td>${tricks}</td>
        <td class="${cls}">${score ?? 0}</td>
      </tr>
    `;
  }).join('');
}

function renderLog(view) {
  const logEl = document.getElementById('game-log');
  logEl.innerHTML = (view.log || []).slice().reverse().map(entry =>
    `<div class="log-entry">${escapeHtml(entry.text)}</div>`).join('');
}

// ============================================================
// MODALS
// ============================================================
function showModal(id) { document.getElementById(id).classList.remove('hidden'); }
function hideModal(id) { document.getElementById(id).classList.add('hidden'); }

function showRoundEndModal(view) {
  const modal = document.getElementById('round-modal');
  if (!modal.classList.contains('hidden')) return; // already shown
  const result = view.lastRoundResult;
  if (!result) return;

  document.getElementById('round-modal-title').textContent =
    `Fin de la manche ${result.round}`;

  const rows = view.players.map(p => {
    const sc = result.scores[p.id] || { bid: '-', tricks: '-', base: 0, bonus: 0, total: 0 };
    const cls = sc.total > 0 ? 'pos-score' : sc.total < 0 ? 'neg-score' : '';
    return `<tr>
      <td>${escapeHtml(p.name)}</td>
      <td>${sc.bid ?? '-'}</td>
      <td>${sc.tricks ?? '-'}</td>
      <td>${sc.base}</td>
      <td>${sc.bonus}</td>
      <td class="${cls}"><strong>${sc.total >= 0 ? '+' : ''}${sc.total}</strong></td>
    </tr>`;
  }).join('');

  document.getElementById('round-modal-body').innerHTML = `
    <table>
      <thead><tr><th>Joueur</th><th>Pari</th><th>Plis</th><th>Base</th><th>Bonus</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  if (view.isHost) {
    document.getElementById('btn-next-round').style.display = '';
    document.getElementById('round-modal-wait').style.display = 'none';
  } else {
    document.getElementById('btn-next-round').style.display = 'none';
    document.getElementById('round-modal-wait').style.display = '';
  }

  showModal('round-modal');
}

function showEndModal(view) {
  const modal = document.getElementById('end-modal');
  if (!modal.classList.contains('hidden')) return;
  const ranking = view.finalRanking || [];
  const rows = ranking.map((r, i) => {
    const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
    return `<tr><td>${medal}</td><td>${escapeHtml(r.name)}</td><td><strong>${r.score}</strong></td></tr>`;
  }).join('');
  document.getElementById('end-modal-body').innerHTML = `
    <table>
      <thead><tr><th></th><th>Joueur</th><th>Score</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  hideModal('round-modal');
  showModal('end-modal');
}

// ============================================================
// FLOW
// ============================================================
function enterGame(gameId) {
  app.net.gameId = gameId;
  app.net.saveTokens();
  app.net.onView = (view) => {
    app.view = view;
    onView(view);
  };
  app.net.onError = (err) => {
    if (err.message === 'not_found') {
      alert("Cette partie n'existe plus.");
      leaveGame();
    }
  };
  app.net.startPolling();
}

function onView(view) {
  if (view.status === 'lobby') {
    showScreen('lobby');
    renderLobby(view);
  } else {
    showScreen('game');
    renderGame(view);
  }
}

function leaveGame() {
  app.net.stopPolling();
  app.net.clearTokens();
  app.net.gameId = null;
  app.net.playerToken = null;
  app.net.hostToken = null;
  app.view = null;
  hideModal('round-modal');
  hideModal('end-modal');
  hideModal('tigress-modal');
  history.replaceState({}, '', window.location.pathname);
  showScreen('home');
}

function updateUrl(gameId) {
  const url = new URL(window.location.href);
  url.searchParams.set('game', gameId);
  history.replaceState({}, '', url.toString());
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ============================================================
// BOOT
// ============================================================
async function boot() {
  bindHomeScreen();
  bindLobby();
  bindGameScreen();

  // Check URL for ?game=XXXX
  const urlParams = new URLSearchParams(window.location.search);
  const gameFromUrl = urlParams.get('game');
  if (gameFromUrl) {
    const id = gameFromUrl.toUpperCase();
    app.net.loadTokens(id);
    if (app.net.playerToken) {
      // Auto-resume
      try {
        const view = await app.net.fetchView();
        if (view && view.players.some(p => p.isMe)) {
          enterGame(id);
          return;
        }
      } catch {}
      // Token périmé
      app.net.clearTokens();
      app.net.playerToken = null;
      app.net.hostToken = null;
    }
    // Pre-fill join code
    document.getElementById('join-id').value = id;
  }
  showScreen('home');
}

document.addEventListener('DOMContentLoaded', boot);
