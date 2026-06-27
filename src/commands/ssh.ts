import WebSocket from 'ws';

export function sshCommand(token: string, host: string): void {
    const wsBase = host.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/terminal/${token}/`;

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
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
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        if (code === 4403) {
            console.error('\nInvalid token.');
        }
        process.exit(0);
    });

    ws.on('error', (err: Error) => {
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
