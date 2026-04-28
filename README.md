# Discord RP bot

Skela za RP Discord bot — dice roller, character sheets, kasnije scene/initiative/inventory.

**Stack:** Node 20+, TypeScript, discord.js v14, dotenv, better-sqlite3 (SQLite), tsx (dev runtime).

## Setup

1. **Token i ID-ovi**
   - Otvori [Discord Developer Portal](https://discord.com/developers/applications) → tvoja aplikacija.
   - **Bot tab** → kopiraj token (ili reset ako ne znaš stari) → stavi u `.env` kao `DISCORD_TOKEN=`.
   - **General Information** → kopiraj `Application ID` → stavi u `.env` kao `CLIENT_ID=`.
   - U Discord-u (sa upaljenim Developer Mode u podešavanjima) desni klik na tvoj test-server → `Copy Server ID` → stavi u `.env` kao `GUILD_ID=` (za instant deploy slash komandi; bez ovoga ide globalna registracija sa do 1h propagacijom).

2. **Invite bot na server**
   - Developer Portal → **OAuth2 → URL Generator**.
   - Scopes: `bot` + `applications.commands`.
   - Bot Permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`.
   - Otvori generisani URL i izaberi server.

3. **Install i deploy**
   ```bash
   npm install
   npm run deploy   # registruje slash komande na guild (instant)
   npm run dev      # pokreće bot u watch modu (tsx)
   ```

   Na console se mora videti: `[ready] Logged in as <BotName>#NNNN`.

## Komande

| Komanda | Šta radi |
|---|---|
| `/ping` | sanity check, vraća latencu |
| `/roll <expr> [reason]` | baca kockice po `NdM[+K]` (npr. `2d20+3`) |
| `/character create <name> [class]` | pravi tvoj karakter na ovom serveru |
| `/character view [@user]` | prikazuje svoj ili tuđi karakter |

## Struktura

```
discord-rp/
├── .env                  ← tvoje tajne (NIKAD u commit)
├── .env.example          ← template, commit-uje se
├── src/
│   ├── index.ts          ← bot entry: client, event/command loader, login
│   ├── deploy-commands.ts ← registracija slash komandi
│   ├── commands/         ← jedan fajl po komandi (export data + execute)
│   ├── events/           ← ready, interactionCreate
│   └── lib/
│       ├── dice.ts       ← parser & roller za NdM+K
│       └── store.ts      ← SQLite (characters tabela)
└── data/                 ← SQLite fajl ovde (rp.db, gitignored)
```

## Future commands (TODO)

- `/scene start|end|set` — vodi RP scenu (dnevnik, mesto, atmosfera).
- `/initiative add|next|reset` — borba turn order.
- `/inventory add|remove|list` — predmeti karaktera.
- NPC sistem sa GM-only komandama (rola "GM" required).

## Sigurnost

- Token NIKAD u code, NIKAD u chat. Samo u `.env` (gitignored).
- Pre push-a: `git status` da `.env` nije među promenama.
- Rotiraj token u Developer Portal-u ako sumnjaš na curenje.

## Skill

Patterni i recepti: `~/.claude/skills/discord-bot-discordjs/SKILL.md`.
