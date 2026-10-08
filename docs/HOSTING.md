# Hosting the EnterG demo on a dedicated Linux server

The demo is a **static website**: about 0.5 MB of HTML, JavaScript and CSS, with all sample data inside the files. The server only hands files to browsers. There is no database, no Node.js running in production and no back end.

## Server requirements

| Item | Minimum | Notes |
|---|---|---|
| Machine | 1 vCPU, 1 GB RAM, 10 GB disk | The smallest VPS is enough for demo traffic (Hetzner, DigitalOcean, OVH, etc.) |
| OS | Ubuntu 24.04 LTS or Debian 12 | Any modern Linux works |
| Web server | Nginx (or Caddy) | Serves the files and handles HTTPS |
| HTTPS certificate | Let's Encrypt (certbot), free | Caddy does this automatically |
| Domain | A subdomain, e.g. `demo.enterg.gr` | DNS A record pointing to the server's IP |
| Firewall | Ports 22 (SSH), 80, 443 open, nothing else | `ufw` |
| Access | SSH key login, password login disabled | Basic hardening |

**Only needed to build the site:** Node.js 20 or 22 LTS, npm and git. The build can run on the server, on a laptop, or automatically from GitHub. The server never runs Node in production.

## Setup steps (Ubuntu)

### 1. Install software

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx git apache2-utils
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Get and build the code

```bash
git clone https://github.com/lemarsan/enterg.git && cd enterg
npm ci && npm run build            # output goes to ./dist
sudo mkdir -p /var/www/enterg && sudo cp -r dist/* /var/www/enterg/
```

### 3. Web server configuration

Create `/etc/nginx/sites-available/enterg`:

```nginx
server {
  server_name demo.enterg.gr;
  root /var/www/enterg;
  index index.html;

  location / { try_files $uri /index.html; }
  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }

  add_header X-Robots-Tag "noindex, nofollow";   # keep it out of search engines
  auth_basic "EnterG demo";                       # password protection
  auth_basic_user_file /etc/nginx/.htpasswd;
}
```

### 4. Enable it, add a password, add HTTPS

```bash
sudo ln -s /etc/nginx/sites-available/enterg /etc/nginx/sites-enabled/
sudo htpasswd -c /etc/nginx/.htpasswd <username>
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d demo.enterg.gr
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

### Updating the demo

```bash
cd enterg && git pull && npm ci && npm run build
sudo rm -rf /var/www/enterg/* && sudo cp -r dist/* /var/www/enterg/
```

This can become a one-line script, or a GitHub Action that deploys on every push.

## Decisions to make

- **Keep it private.** Put it behind a password (as above) or restrict it to office/VPN IPs, and keep `noindex`. The demo looks like a real betting site; a public, unlicensed-looking gambling site under a Greek domain could draw attention from ΕΕΕΠ or competitors, and it is an unreleased product.
- **Web addresses.** The app uses `#/` addresses (e.g. `demo.enterg.gr/#/casino`), which work on any server with no setup. Switching to clean addresses (`/casino`) is a one-line change in `src/App.tsx` (HashRouter → BrowserRouter); the `try_files` rule above already supports it.
- **Fonts.** The font loads from Google Fonts. Some EU companies prefer self-hosting fonts for GDPR reasons; that is a small change.
- **Share links.** Bet share links point to the server's own address, so they work fully once hosted.

## When the real back end is connected

Requirements change at that stage. The front end still deploys as above, but it then needs the website back end described in the architecture document: the Node.js session/API service, Redis, the WebSocket gateway for live odds, and the connection to the system back end's APIs. Expect at least 2–3 servers or containers, plus monitoring and backups. A live licensed operator must also follow ΕΕΕΠ rules on where servers are hosted. That needs its own sizing exercise.
