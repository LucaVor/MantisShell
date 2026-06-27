import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

function request(host: string, method: string, urlPath: string, token: string, body?: Buffer): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, host);
        const isHttps = url.protocol === 'https:';
        const mod = isHttps ? https : http;

        const headers: Record<string, string> = {
            'X-Mantis-Token': token,
        };

        if (body && !urlPath.includes('upload')) {
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = body.length.toString();
        }

        const options: http.RequestOptions = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method,
            headers,
        };

        const req = mod.request(options, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                resolve({
                    status: res.statusCode || 0,
                    headers: res.headers,
                    body: Buffer.concat(chunks),
                });
            });
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

export async function fetchTree(token: string, host: string, dirPath?: string): Promise<unknown[]> {
    const ts = Date.now();
    const url = dirPath
        ? `/api/filesystem/00000000-0000-0000-0000-000000000000/tree/${dirPath}?token=${token}&_t=${ts}`
        : `/api/filesystem/00000000-0000-0000-0000-000000000000/tree/?token=${token}&_t=${ts}`;
    const res = await request(host, 'GET', url, token);
    if (res.status >= 400) {
        throw new Error(`List failed (${res.status}): ${res.body.toString().slice(0, 100)}`);
    }
    return JSON.parse(res.body.toString());
}

export async function downloadFile(token: string, host: string, remotePath: string): Promise<Buffer> {
    const url = `/api/filesystem/00000000-0000-0000-0000-000000000000/download/${remotePath}/?token=${token}`;
    const res = await request(host, 'GET', url, token);
    if (res.status >= 400) {
        throw new Error(`Download failed (${res.status}): ${res.body.toString().slice(0, 100)}`);
    }
    return res.body;
}

export async function uploadFile(token: string, host: string, localPath: string, remotePath: string): Promise<void> {
    const url = new URL(`/api/filesystem/00000000-0000-0000-0000-000000000000/upload/?token=${token}`, host);
    const isHttps = url.protocol === 'https:';
    const mod = isHttps ? https : http;

    const fileName = path.basename(localPath);
    const fileContent = fs.readFileSync(localPath);
    const boundary = '----MantisUpload' + Date.now();

    const parts: Buffer[] = [];
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
    parts.push(fileContent);
    parts.push(Buffer.from('\r\n'));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="path"\r\n\r\n${remotePath}\r\n`));
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    return new Promise((resolve, reject) => {
        const req = mod.request({
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length.toString(),
                'X-Mantis-Token': token,
            },
        }, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`Upload failed (${res.statusCode}): ${Buffer.concat(chunks).toString().slice(0, 100)}`));
                } else {
                    resolve();
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
