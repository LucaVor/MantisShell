import WebSocket from 'ws';
import { getConfig } from '../config';

export function sshCommand(spaceId?: string): void {
    const config = getConfig();
    if (!config || !config.email) {
        console.error('Not logged in. Run `mantis login` first.');
        process.exit(1);
    }

    const targetSpace = spaceId || config.defaultSpaceId;
    if (!targetSpace) {
        console.error('No space specified. Pass a space ID or set a default with `mantis use <space-id>`.');
        process.exit(1);
    }

    const wsBase = config.apiHost.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/terminal/${targetSpace}/${encodeURIComponent(config.email)}/`;

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
        // Put stdin in raw mode for full terminal pass-through
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        process.stdin.resume();

        // Send initial terminal size
        const { rows, columns } = process.stdout;
        if (rows && columns) {
            ws.send(JSON.stringify({ type: 'resize', rows, cols: columns }));
        }

        // stdin → WebSocket
        process.stdin.on('data', (data: Buffer) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

        // Handle terminal resize
        process.stdout.on('resize', () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'resize',
                    rows: process.stdout.rows,
                    cols: process.stdout.columns,
                }));
            }
        });
    });

    // WebSocket → stdout
    ws.on('message', (data: WebSocket.RawData) => {
        if (Buffer.isBuffer(data)) {
            process.stdout.write(data);
        } else if (data instanceof ArrayBuffer) {
            process.stdout.write(Buffer.from(data));
        } else {
            process.stdout.write(data.toString());
        }
    });

    ws.on('close', (code: number) => {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        if (code === 4404) {
            console.error('\nNo workspace container provisioned yet. Open the space in the browser first.');
        }
        process.exit(0);
    });

    ws.on('error', (err: Error) => {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        console.error(`\nConnection failed: ${err.message}`);
        process.exit(1);
    });

    // Clean exit on Ctrl+D (stdin end)
    process.stdin.on('end', () => {
        ws.close();
    });
}
