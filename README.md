# ☠️ Skull King Online

Jeu de cartes Skull King en multijoueur, déployable en un clic sur Vercel.
Plusieurs joueurs rejoignent une partie via un lien partagé `?game=XXXXXX`.

## Stack

- **Frontend** : HTML/CSS/JS vanilla (ES modules) — pas de build
- **Backend** : Vercel Serverless Functions (Node.js)
- **Stockage** : Vercel KV (Upstash Redis) — fallback mémoire en local
- **Sync** : polling 1.5 s (turn-based, pas besoin de WebSocket)

## Déploiement (5 minutes)

### 1. Pousser sur GitHub

```bash
cd skullking-online
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<votre-user>/skullking-online.git
git push -u origin main
```

### 2. Importer sur Vercel

1. Aller sur https://vercel.com/new
2. Importer le repo GitHub
3. **Framework Preset** : "Other" (pas de build)
4. Cliquer **Deploy**

### 3. Activer Vercel KV

1. Sur le projet Vercel → onglet **Storage**
2. **Create Database** → **KV (Upstash Redis)**
3. **Connect** au projet
4. Les variables d'environnement (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.) sont injectées automatiquement
5. **Redeploy** le projet (onglet Deployments → ⋯ → Redeploy)

✅ L'app est en ligne. Le lien partagé est `https://<projet>.vercel.app/?game=XXXXXX`.

> ⚠️ Sans KV, l'app fonctionne mais **le state se perd à chaque cold-start** des fonctions serverless (= chaque partie disparaît au bout de quelques minutes). En local avec `vercel dev`, un fallback mémoire est utilisé.

## Développement local

```bash
npm install
npx vercel dev
```

L'app tourne sur `http://localhost:3000`. En local, pas besoin de KV — un store en mémoire est utilisé. **Attention** : en local, il faut un seul process serveur, donc tous les joueurs doivent passer par le même `localhost`.

## Comment jouer

1. Aller sur l'URL de l'app
2. Saisir son nom → **Créer une partie** → un code à 6 caractères est généré
3. Partager le lien `?game=XXXXXX` avec les autres joueurs
4. Les joueurs rejoignent depuis le lien
5. L'hôte ajuste les options (manches, Kraken/Baleine, ajouter des bots) puis clique **Lancer la partie**

## Règles implémentées

- Cartes numérotées 1-14 dans 4 couleurs (atout = drapeau pirate noir)
- 5 Pirates, Skull King, 2 Sirènes, 5 Évasions, Tigresse
- Extension Kraken / Baleine Blanche (toggleable dans les options)
- Bonus +10/+20 pour les 14 capturés (mise réussie uniquement)
- Pari à zéro = ±10 × manche

### Non implémenté en v1

- **Pouvoirs des pirates** (Rascal, Harry, Will, Rosie, Juanita) — désactivés en v1 online (les pirates nommés agissent comme des pirates standards). Prévu pour v2.

## Architecture

```
skullking-online/
├── public/                 # Statique (servi tel quel)
│   ├── index.html
│   ├── style.css
│   ├── client.js           # NetClient + UI (zéro logique de règle)
│   ├── engine.js           # Moteur partagé (deck, règles, score, IA)
│   └── svg.js              # Bibliothèque d'illustrations
├── api/                    # Serverless functions
│   ├── game.js             # POST → crée une partie
│   └── game/[id].js        # GET state, POST action
├── lib/
│   └── store.js            # Abstraction KV / fallback mémoire
├── package.json
├── vercel.json
└── .gitignore
```

### Modèle de sécurité

- Chaque joueur reçoit un `playerToken` (UUID stocké en `localStorage`)
- Le serveur est **autoritaire** : il garde le state complet et filtre la main des autres joueurs avant de renvoyer à un client
- Toutes les actions transitent par l'API qui valide le `playerToken` et le tour en cours
- L'hôte est identifié par un `hostToken` séparé (pour kicker, démarrer, modifier les options)

### Bots

- Les bots sont exécutés **côté serveur** dans le handler de l'action qui termine un tour humain. La requête revient avec tous les coups joués jusqu'au prochain humain à jouer.
- Pas de cron : les bots ne jouent que quand un humain pousse une action.

## Licence

MIT — usage personnel et apprentissage. Skull King® est une marque de Grandpa Beck's Games.
