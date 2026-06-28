import WebSocket from 'ws';

export function sshCommand(token: string, host: string): void {
    const wsBase = host.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/terminal/${token}/`;

    const ws = new WebSocket(wsUrl, {
        perMessageDeflate: false,
        handshakeTimeout: 10000,
    });

    let pingInterval: ReturnType<typeof setInterval> | null = null;

    ws.on('open', () => {
        // Keepalive: send both protocol ping AND a text heartbeat every 15s
        pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
                ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
        }, 15000);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        process.stdin.resume();

        const { rows, columns } = process.stdout;
        if (rows && columns) {
            ws.send(JSON.stringify({ type: 'resize', rows, cols: columns }));
        }

        process.stdin.on('data', (data: Buffer) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

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
        if (pingInterval) clearInterval(pingInterval);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        if (code === 4403) {
            console.error('\nInvalid token.');
        }
        process.exit(0);
    });

    ws.on('error', (err: Error) => {
        if (pingInterval) clearInterval(pingInterval);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        console.error(`Connection failed: ${err.message}`);
        process.exit(1);
    });

    process.stdin.on('end', () => {
        ws.close();
    });
}
