import WebSocket from 'ws';
import { getConfig } from '../config';

export function runCommand(command: string, spaceId?: string): void {
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
    let sentCommand = false;

    ws.on('open', () => {
        // Send resize
        ws.send(JSON.stringify({ type: 'resize', rows: process.stdout.rows || 24, cols: process.stdout.columns || 80 }));

        // Wait briefly for prompt, then send command
        setTimeout(() => {
            ws.send(`${command}\n`);
            sentCommand = true;
            // Send exit after command so we disconnect cleanly
            setTimeout(() => {
                ws.send('exit\n');
            }, 500);
        }, 300);
    });

    ws.on('message', (data: WebSocket.RawData) => {
        if (!sentCommand) return; // Skip initial prompt
        if (Buffer.isBuffer(data)) {
            process.stdout.write(data);
        } else if (data instanceof ArrayBuffer) {
            process.stdout.write(Buffer.from(data));
        } else {
            process.stdout.write(data.toString());
        }
    });

    ws.on('close', () => {
        process.exit(0);
    });

    ws.on('error', (err: Error) => {
        console.error(`Connection failed: ${err.message}`);
        process.exit(1);
    });
}
