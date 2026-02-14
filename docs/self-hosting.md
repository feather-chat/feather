# Self-Hosting Guide

This guide covers everything you need to deploy Feather on your own server.

## Requirements

- A Linux, macOS, or Windows server
- Port 8080 (default) available, or any port of your choosing
- A web server (nginx, Caddy, etc.) for serving the frontend and proxying API requests (optional but recommended for production)

## Quick Start

1. Download the latest release for your platform from the [releases page](https://github.com/bradsimantel/feather/releases)
2. Extract the frontend tarball
3. Start the server

```bash
# Download backend binary and frontend
curl -LO https://github.com/bradsimantel/feather/releases/latest/download/feather-linux-amd64
curl -LO https://github.com/bradsimantel/feather/releases/latest/download/feather-web.tar.gz
chmod +x feather-linux-amd64

# Extract frontend
mkdir -p web
tar -xzf feather-web.tar.gz -C web

# Start the server
./feather-linux-amd64
```

The server starts on `http://localhost:8080`. The first user to register will automatically have a workspace created for them.

## Available Binaries

Each release includes pre-built binaries for six platforms:

| OS      | Architecture | Binary Name                 |
| ------- | ------------ | --------------------------- |
| Linux   | x86_64       | `feather-linux-amd64`       |
| Linux   | ARM64        | `feather-linux-arm64`       |
| macOS   | x86_64       | `feather-darwin-amd64`      |
| macOS   | ARM64        | `feather-darwin-arm64`      |
| Windows | x86_64       | `feather-windows-amd64.exe` |
| Windows | ARM64        | `feather-windows-arm64.exe` |

A `feather-web.tar.gz` frontend bundle is also included.

## Data Directory

By default, Feather stores all data under `./data/` relative to where you run the binary:

```
data/
├── feather.db    # SQLite database
├── uploads/      # Uploaded files
└── certs/        # TLS certificates (if using auto TLS)
```

You can customize these paths via [configuration](./configuration.md). For production, use absolute paths:

```yaml
database:
  path: '/var/lib/feather/feather.db'

files:
  storage_path: '/var/lib/feather/uploads'
```

## Configuration

Create a `config.yaml` in the same directory as the binary (or pass `--config /path/to/config.yaml`). See the [Configuration Reference](./configuration.md) for all options.

A minimal production config:

```yaml
server:
  public_url: 'https://chat.example.com'
  allowed_origins: [] # Empty for same-origin deployments

files:
  signing_secret: 'your-random-secret-here' # Generate with: openssl rand -hex 32

email:
  enabled: true
  host: 'smtp.example.com'
  port: 587
  username: 'feather@example.com'
  password: 'your-smtp-password'
  from: 'feather@example.com'
```

Configuration can also be set via environment variables with the `FEATHER_` prefix or CLI flags. See the [Configuration Reference](./configuration.md) for details.

## Reverse Proxy Setup

For production, you'll want a reverse proxy to handle TLS, serve the frontend, and proxy API requests to the Feather backend.

### nginx

```nginx
server {
    listen 443 ssl http2;
    server_name chat.example.com;

    ssl_certificate     /etc/letsencrypt/live/chat.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.example.com/privkey.pem;

    # Frontend static files
    root /var/www/feather/web;
    index index.html;

    # API and SSE requests → backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8080;
    }

    # SPA fallback — serve index.html for all other routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Caddy

```
chat.example.com {
    root * /var/www/feather/web

    # API → backend
    handle /api/* {
        reverse_proxy localhost:8080
    }

    handle /health {
        reverse_proxy localhost:8080
    }

    # Frontend SPA
    handle {
        try_files {path} /index.html
        file_server
    }
}
```

When using a reverse proxy, set `allowed_origins` to an empty list since everything is same-origin:

```yaml
server:
  allowed_origins: []
```

## Built-in TLS

Feather has built-in TLS support if you don't want to use a reverse proxy.

### Automatic (Let's Encrypt)

```yaml
server:
  port: 443
  public_url: 'https://chat.example.com'
  tls:
    mode: 'auto'
    auto:
      domain: 'chat.example.com'
      email: 'admin@example.com'
      cache_dir: './data/certs'
```

This automatically obtains and renews certificates from Let's Encrypt. Port 443 must be reachable from the internet.

### Manual Certificates

```yaml
server:
  port: 443
  public_url: 'https://chat.example.com'
  tls:
    mode: 'manual'
    cert_file: '/etc/ssl/certs/chat.example.com.pem'
    key_file: '/etc/ssl/private/chat.example.com.key'
```

## Email Setup

Email is optional but enables password resets, workspace invites, and notification digests. Without email, users can only be invited via shareable invite links.

```yaml
email:
  enabled: true
  host: 'smtp.example.com'
  port: 587
  username: 'feather@example.com'
  password: 'your-smtp-password'
  from: 'Feather <feather@example.com>'
```

Feather works with any SMTP provider (Postmark, Mailgun, SendGrid, Amazon SES, self-hosted, etc.).

## Running as a systemd Service

Create `/etc/systemd/system/feather.service`:

```ini
[Unit]
Description=Feather
After=network.target

[Service]
Type=simple
User=feather
Group=feather
WorkingDirectory=/opt/feather
ExecStart=/opt/feather/feather --config /opt/feather/config.yaml
Restart=always
RestartSec=5

# Hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/feather

[Install]
WantedBy=multi-user.target
```

Set it up:

```bash
# Create user
sudo useradd --system --shell /usr/sbin/nologin feather

# Create directories
sudo mkdir -p /opt/feather /var/lib/feather/uploads
sudo chown -R feather:feather /opt/feather /var/lib/feather

# Copy files
sudo cp feather-linux-amd64 /opt/feather/feather
sudo cp config.yaml /opt/feather/config.yaml
sudo chmod +x /opt/feather/feather

# Enable and start
sudo systemctl enable feather
sudo systemctl start feather

# Check status
sudo systemctl status feather
sudo journalctl -u feather -f
```

## Backups

All persistent state is in two places:

1. **SQLite database** — the single `.db` file (default: `./data/feather.db`)
2. **Uploaded files** — the uploads directory (default: `./data/uploads/`)

To back up:

```bash
# SQLite backup (safe to run while server is running — uses WAL mode)
sqlite3 /var/lib/feather/feather.db ".backup '/backups/feather-$(date +%Y%m%d).db'"

# File uploads
rsync -a /var/lib/feather/uploads/ /backups/uploads/
```

## Upgrading

1. Download the new binary from the releases page
2. Stop the server (`sudo systemctl stop feather`)
3. Replace the binary
4. Start the server (`sudo systemctl start feather`)

Database migrations run automatically on startup. There is no manual migration step.

## Building from Source

```bash
git clone https://github.com/bradsimantel/feather.git
cd feather
make install
make build
```

The backend binary will be at `api/bin/feather` and the frontend at `clients/web/dist/`.
