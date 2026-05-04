// ===================================================================
// Store abstraction — Vercel KV en prod, Map en mémoire en dev
// ===================================================================

let kv = null;
const memory = new Map();

async function getKv() {
  if (kv !== null) return kv;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    kv = false;
    return false;
  }
  try {
    const mod = await import('@vercel/kv');
    kv = mod.kv;
    return kv;
  } catch {
    kv = false;
    return false;
  }
}

const TTL_SECONDS = 60 * 60 * 6; // 6h — purge auto des parties abandonnées

export async function getGame(id) {
  const k = await getKv();
  if (k) {
    const data = await k.get(`game:${id}`);
    return data || null;
  }
  return memory.get(id) || null;
}

export async function setGame(id, game) {
  const k = await getKv();
  if (k) {
    await k.set(`game:${id}`, game, { ex: TTL_SECONDS });
    return;
  }
  memory.set(id, game);
}

export async function deleteGame(id) {
  const k = await getKv();
  if (k) {
    await k.del(`game:${id}`);
    return;
  }
  memory.delete(id);
}

// Verrou simple optimiste : on lit, on modifie, on écrit. Conflits rares en
// jeu turn-based ; en cas de course, le second client recevra une erreur 409
// et resynchronisera via le poll suivant.
export async function withGame(id, mutator) {
  const game = await getGame(id);
  if (!game) return { error: 'not_found' };
  const result = await mutator(game);
  if (result && result.error) return result;
  await setGame(id, game);
  return { ...(result || {}), ok: true, game };
}
