# PingAlive

> Keep your free Render, Railway, Fly.io servers awake — automatically.

Free hosting platforms sleep your server after 15 minutes of inactivity. PingAlive sends scheduled GET requests to keep it alive. No signup, no password, no config.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dangbt/pingalive)
&nbsp;
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-dangbt-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/dangbt)

---

## How it works

1. **Pick a username** — no password, no email required
2. **Add your server URL** — and choose a ping interval
3. **Stay awake** — PingAlive sends automatic GET requests on schedule

Runs as a [Cloudflare Worker](https://workers.cloudflare.com/) with a cron trigger every minute. URLs that are due for a ping are fetched in parallel. Data is stored in [Neon](https://neon.tech/) serverless PostgreSQL.

## Stack

| Layer | Tech |
|---|---|
| Runtime | Cloudflare Workers |
| Cron | `* * * * *` via Wrangler triggers |
| Database | Neon PostgreSQL (serverless) |
| Language | TypeScript |

## Self-hosting

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages) (free tier works)
- [Neon account](https://neon.tech) (free tier works)
- Node.js + pnpm

### Setup

```bash
git clone https://github.com/dangbt/pingalive
cd pingalive
pnpm install
```

Create a `.dev.vars` file for local development:

```
DATABASE_URL=postgres://...your-neon-connection-string...
```

Initialize the database tables (run once after deploy):

```
GET https://your-worker.workers.dev/api/init
```

### Development

```bash
pnpm dev
```

### Deploy

```bash
# Set the secret in Cloudflare
wrangler secret put DATABASE_URL

# Deploy
pnpm deploy
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Web UI |
| `GET` | `/api/stats` | Total monitors & pings |
| `GET` | `/api/monitors?username=x` | List monitors for a user |
| `POST` | `/api/monitors` | Add a monitor |
| `DELETE` | `/api/monitors/:id?username=x` | Remove a monitor |
| `GET` | `/api/init` | Create DB tables (run once) |

## Security

- Private/loopback IPs and `localhost` are blocked
- Maximum 20 monitors per username
- Duplicate URLs per user are rejected
- 12-second fetch timeout per ping

## Support

If this is useful to you, consider buying me a coffee:

[![Buy Me a Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/dangbt)

## License

MIT
