// ===================================================================
// SKULL KING — Moteur partagé (client + serveur)
// Pure logique : pas de DOM, pas d'I/O, pas de state global.
// ===================================================================

export const SUITS = ['yellow', 'green', 'purple', 'black'];
export const SUIT_ORDER = { yellow: 0, green: 1, purple: 2, black: 3 };

export const PIRATE_NAMES = [
  'Rosie la Douce',
  'Will le Bandit',
  'Rascal le Flambeur',
  'Juanita Jade',
  'Harry le Géant',
];

// ============================================================
// DECK
// ============================================================
export function buildDeck(opts = { kraken: true, whale: true }) {
  const cards = [];
  let id = 0;
  for (const suit of SUITS) {
    for (let v = 1; v <= 14; v++) {
      cards.push({ id: id++, type: 'number', suit, value: v });
    }
  }
  for (const name of PIRATE_NAMES) {
    cards.push({ id: id++, type: 'pirate', name });
  }
  cards.push({ id: id++, type: 'skullking' });
  cards.push({ id: id++, type: 'mermaid' });
  cards.push({ id: id++, type: 'mermaid' });
  for (let i = 0; i < 5; i++) cards.push({ id: id++, type: 'escape' });
  cards.push({ id: id++, type: 'tigress' });
  if (opts.kraken) cards.push({ id: id++, type: 'kraken' });
  if (opts.whale)  cards.push({ id: id++, type: 'whitewhale' });
  return cards;
}

export function shuffle(deck, rng = Math.random) {
  const a = deck.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// HELPERS
// ============================================================
export function specialOrder(card) {
  const o = { escape: 0, mermaid: 1, tigress: 2, pirate: 3, skullking: 4, kraken: 5, whitewhale: 6 };
  return o[card.type] ?? 9;
}

export function sortHand(hand) {
  return hand.slice().sort((a, b) => {
    if (a.type === 'number' && b.type === 'number') {
      if (a.suit !== b.suit) return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
      return a.value - b.value;
    }
    if (a.type === 'number') return -1;
    if (b.type === 'number') return 1;
    return specialOrder(a) - specialOrder(b);
  });
}

// ============================================================
// RULES
// ============================================================
function isEffectivePirate(p) {
  if (p.card.type === 'pirate') return true;
  if (p.card.type === 'tigress' && p.card.mode === 'pirate') return true;
  return false;
}

function isEffectiveEscape(p) {
  if (p.card.type === 'escape') return true;
  if (p.card.type === 'tigress' && p.card.mode === 'escape') return true;
  return false;
}

export function getLeadSuit(plays) {
  for (const p of plays) {
    if (isEffectiveEscape(p)) continue;
    if (p.card.type === 'number') return p.card.suit;
    return null;
  }
  return null;
}

export function isLeadSuitFixed(plays) {
  for (const p of plays) {
    if (isEffectiveEscape(p)) continue;
    return p.card.type === 'number';
  }
  return false;
}

export function getPlayableCards(hand, plays) {
  if (!isLeadSuitFixed(plays)) return hand.slice();
  const lead = getLeadSuit(plays);
  if (lead === null) return hand.slice();
  const sameSuit = hand.filter(c => c.type === 'number' && c.suit === lead);
  if (sameSuit.length === 0) return hand.slice();
  return hand.filter(c => c.type !== 'number' || c.suit === lead);
}

export function resolveTrick(plays) {
  if (!plays.length) return { cancelled: true };
  const kraken = plays.find(p => p.card.type === 'kraken');
  const whale  = plays.find(p => p.card.type === 'whitewhale');

  if (kraken && whale) {
    const lastIsKraken = plays.indexOf(kraken) > plays.indexOf(whale);
    if (lastIsKraken) {
      const virtual = resolveStandard(plays.filter(p => p.card.type !== 'kraken'));
      return { cancelled: true, virtualWinnerId: virtual.winnerId, info: 'Kraken (priorité)' };
    }
    return resolveWhale(plays);
  }
  if (kraken) {
    const virtual = resolveStandard(plays.filter(p => p.card.type !== 'kraken'));
    return { cancelled: true, virtualWinnerId: virtual.winnerId, info: 'Kraken' };
  }
  if (whale) return resolveWhale(plays);
  return resolveStandard(plays);
}

function resolveStandard(plays) {
  if (!plays.length) return { cancelled: true };
  const sk       = plays.find(p => p.card.type === 'skullking');
  const pirates  = plays.filter(p => isEffectivePirate(p));
  const mermaids = plays.filter(p => p.card.type === 'mermaid');

  if (sk && mermaids.length > 0 && pirates.length > 0) {
    return { winnerId: mermaids[0].playerId, bonus: 40, cancelled: false };
  }
  if (sk && pirates.length > 0) {
    return { winnerId: sk.playerId, bonus: 30 * pirates.length, cancelled: false };
  }
  if (sk && mermaids.length > 0) {
    return { winnerId: mermaids[0].playerId, bonus: 40, cancelled: false };
  }
  if (sk) return { winnerId: sk.playerId, bonus: 0, cancelled: false };
  if (pirates.length > 0 && mermaids.length > 0) {
    return { winnerId: pirates[0].playerId, bonus: 20 * mermaids.length, cancelled: false };
  }
  if (pirates.length > 0) return { winnerId: pirates[0].playerId, bonus: 0, cancelled: false };
  if (mermaids.length > 0) return { winnerId: mermaids[0].playerId, bonus: 0, cancelled: false };

  const numbered = plays.filter(p => p.card.type === 'number');
  if (numbered.length === 0) return { winnerId: plays[0].playerId, bonus: 0, cancelled: false };

  const trumps = numbered.filter(p => p.card.suit === 'black');
  if (trumps.length > 0) {
    const sorted = trumps.slice().sort((a, b) => {
      if (b.card.value !== a.card.value) return b.card.value - a.card.value;
      return plays.indexOf(a) - plays.indexOf(b);
    });
    return { winnerId: sorted[0].playerId, bonus: 0, cancelled: false };
  }
  const lead = getLeadSuit(plays);
  const sameLead = numbered.filter(p => p.card.suit === lead);
  if (sameLead.length === 0) return { winnerId: plays[0].playerId, bonus: 0, cancelled: false };
  const sorted = sameLead.slice().sort((a, b) => {
    if (b.card.value !== a.card.value) return b.card.value - a.card.value;
    return plays.indexOf(a) - plays.indexOf(b);
  });
  return { winnerId: sorted[0].playerId, bonus: 0, cancelled: false };
}

function resolveWhale(plays) {
  const numbered = plays.filter(p => p.card.type === 'number');
  if (numbered.length === 0) {
    const whale = plays.find(p => p.card.type === 'whitewhale');
    return { cancelled: true, virtualWinnerId: whale.playerId, info: 'Baleine (vide)' };
  }
  const sorted = numbered.slice().sort((a, b) => {
    if (b.card.value !== a.card.value) return b.card.value - a.card.value;
    return plays.indexOf(a) - plays.indexOf(b);
  });
  return { winnerId: sorted[0].playerId, bonus: 0, cancelled: false, info: 'Baleine Blanche' };
}

export function computeTreasureBonus(tricksWon) {
  let bonus = 0;
  for (const t of tricksWon) {
    if (t.cancelled) continue;
    for (const play of t.plays) {
      if (play.card.type === 'number' && play.card.value === 14) {
        bonus += play.card.suit === 'black' ? 20 : 10;
      }
    }
  }
  return bonus;
}

// ============================================================
// SCORE
// ============================================================
export function calculateScore(player, roundNum) {
  const bid = player.bid, tricks = player.tricks;
  const captureBonus = player.bonusThisRound || 0;
  const treasureBonus = player.treasureBonus || 0;
  let base = 0, bonus = 0;
  if (bid === 0) {
    base = (tricks === 0) ? 10 * roundNum : -10 * roundNum;
  } else if (tricks === bid) {
    base = 20 * bid;
    bonus = captureBonus + treasureBonus;
  } else {
    base = -10 * Math.abs(tricks - bid);
  }
  return { base, bonus, total: base + bonus };
}

// ============================================================
// BOT IA
// ============================================================
function cardStrength(card) {
  switch (card.type) {
    case 'skullking': return 0.95;
    case 'pirate':    return 0.85;
    case 'tigress':   return 0.65;
    case 'mermaid':   return 0.5;
    case 'whitewhale':return 0.3;
    case 'escape':    return 0.0;
    case 'kraken':    return 0.05;
    case 'number':
      if (card.suit === 'black') return 0.3 + (card.value / 14) * 0.55;
      return 0.05 + (card.value / 14) * 0.4;
  }
  return 0.1;
}

export function botChooseBid(hand, roundNum, rng = Math.random) {
  let estimated = 0;
  for (const c of hand) estimated += cardStrength(c);
  let bid = Math.round(estimated * 0.85);
  bid += Math.floor(rng() * 3) - 1;
  return Math.max(0, Math.min(roundNum, bid));
}

export function botChooseCard(hand, plays, bid, tricks) {
  const playable = getPlayableCards(hand, plays);
  const wantsToWin = tricks < bid;
  const hasOvershot = tricks >= bid && bid > 0;
  const sorted = playable.slice().sort((a, b) => cardStrength(b) - cardStrength(a));

  if (bid === 0) return sorted[sorted.length - 1];
  if (hasOvershot) {
    const escape = playable.find(c => c.type === 'escape');
    if (escape) return escape;
    return sorted[sorted.length - 1];
  }
  if (wantsToWin) {
    const lead = getLeadSuit(plays);
    if (lead) {
      const sameSuit = playable.filter(c => c.type === 'number' && c.suit === lead);
      if (sameSuit.length > 0) {
        const opponentSpecial = plays.some(p => p.card.type === 'pirate' || p.card.type === 'skullking');
        if (opponentSpecial) return sameSuit.sort((a, b) => a.value - b.value)[0];
        return sameSuit.sort((a, b) => b.value - a.value)[0];
      }
    }
    return sorted[0];
  }
  return sorted[Math.floor(sorted.length / 2)] || sorted[0];
}

export function botChooseTigressMode(bid, tricks) {
  return tricks < bid ? 'pirate' : 'escape';
}
