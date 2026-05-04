// ===================================================================
// POST /api/game — crée une nouvelle partie et renvoie un code court
// ===================================================================

import { setGame, getGame } from '../lib/store.js';
import { randomUUID } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I/O/0/1
function genId() {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

async function uniqueId() {
  for (let i = 0; i < 6; i++) {
    const id = genId();
    const existing = await getGame(id);
    if (!existing) return id;
  }
  // fallback ultra rare
  return genId() + Math.floor(Math.random() * 100);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const hostName = (body.name || 'Hôte').toString().slice(0, 14);
  const hostToken = randomUUID();
  const playerToken = randomUUID();
  const id = await uniqueId();

  const game = {
    id,
    status: 'lobby', // lobby | bidding | playing | roundEnd | finished
    hostToken,
    options: {
      totalRounds: 10,
      kraken: true,
      whale: true,
    },
    players: [
      {
        id: playerToken,
        name: hostName,
        isBot: false,
        connected: true,
        joinedAt: Date.now(),
      },
    ],
    round: null,
    roundResults: [],
    log: [{ ts: Date.now(), text: `${hostName} a créé la partie.` }],
    version: 1,
    createdAt: Date.now(),
  };

  await setGame(id, game);
  res.status(200).json({ gameId: id, hostToken, playerToken });
}
