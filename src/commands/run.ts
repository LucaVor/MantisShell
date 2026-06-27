import WebSocket from 'ws';

export function runCommand(command: string, token: string, host: string): void {
    const wsBase = host.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/terminal/${token}/`;

    const ws = new WebSocket(wsUrl);
    let sentCommand = false;

    ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'resize', rows: process.stdout.rows || 24, cols: process.stdout.columns || 80 }));
        setTimeout(() => {
            ws.send(`${command}\nexit\n`);
            sentCommand = true;
        }, 300);
    });

    ws.on('message', (data: WebSocket.RawData) => {
        if (!sentCommand) return;
        if (Buffer.isBuffer(data)) {
            process.stdout.write(data);
        } else if (data instanceof ArrayBuffer) {
            process.stdout.write(Buffer.from(data));
        } else {
            process.stdout.write(data.toString());
        }
    });

    ws.on('close', () => process.exit(0));
    ws.on('error', (err: Error) => {
        console.error(`Connection failed: ${err.message}`);
        process.exit(1);
    });
}
