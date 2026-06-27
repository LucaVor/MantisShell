# MantisShell

CLI for accessing Mantis workspace containers from your local terminal.

## Install

```bash
npm install -g github:LucaVor/MantisShell
```

Or run directly without installing:

```bash
npx github:LucaVor/MantisShell <command>
```

## Authentication

Every command requires a workspace token. Get it from the CLI button in the Mantis file browser panel.

You can pass it per-command with `-t`:

```bash
mantis ssh <token>
mantis ls -t <token>
```

Or set it as an environment variable:

```bash
export MANTIS_TOKEN=<token>
mantis ls
mantis push ./file.py
```

## Commands

### Terminal session

```bash
mantis ssh <token>
mantis ssh <token> -H https://mantis.example.com
```

Opens an interactive terminal in your workspace container. Ctrl+D to exit.

### List files

```bash
mantis ls -t <token>
mantis ls subdir/ -t <token>
```

### Upload files

```bash
mantis push ./script.py -t <token>
mantis push ./data/ remote-data/ -t <token>
```

### Download files

```bash
mantis pull output.png ./ -t <token>
mantis pull results/data.csv ./local.csv -t <token>
```

### Run a command

```bash
mantis run "python analysis.py" -t <token>
mantis run "pip install pandas" -t <token>
```

Streams output and exits when done.

## Options

All commands accept:

- `-t, --token <token>` : workspace access token (or `MANTIS_TOKEN` env var)
- `-H, --host <host>` : API host (default: `http://localhost:8000` or `MANTIS_HOST` env var)

## How it works

Connects to the Mantis backend over WebSocket (terminal) and HTTP (file ops). Uses the same infrastructure as the web UI. No SSH, no port forwarding, no tunnels.

## Requirements

- Node.js 18+
