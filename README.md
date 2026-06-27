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

## Setup

```bash
mantis login
```

You'll be prompted for your email, API host, and default space ID.

Config is saved to `~/.mantis/config.json`.

## Commands

### Terminal session

```bash
mantis ssh
```

Opens an interactive terminal in your workspace container. Same environment the agent uses. Ctrl+D to exit.

### List files

```bash
mantis ls
mantis ls subdir/
```

### Upload files

```bash
mantis push ./script.py
mantis push ./data/ remote-data/
```

### Download files

```bash
mantis pull output.png ./
mantis pull results/data.csv ./local-copy.csv
```

### Run a command

```bash
mantis run "python analysis.py"
mantis run "pip install pandas"
```

Streams output and exits when done.

### Set default space

```bash
mantis use <space-id>
```

## How it works

MantisShell connects to the Mantis backend over WebSocket (for terminal) and HTTP (for file operations). It uses the same infrastructure as the web UI's built-in terminal and file browser. No SSH, no port forwarding, no tunnels.

## Requirements

- Node.js 18+
- A running Mantis backend with a provisioned workspace (open the space in the browser first)
