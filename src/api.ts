import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { MantisConfig } from './config';

function request(config: MantisConfig, method: string, urlPath: string, body?: Buffer | string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, config.apiHost);
        const isHttps = url.protocol === 'https:';
        const mod = isHttps ? https : http;

        const headers: Record<string, string> = {
            'X-User-Email': config.email,
        };

        if (body && typeof body === 'string') {
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = Buffer.byteLength(body).toString();
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

export async function fetchTree(config: MantisConfig, spaceId: string, dirPath?: string): Promise<unknown[]> {
    const ts = Date.now();
    const url = dirPath
        ? `/api/filesystem/${spaceId}/tree/${dirPath}?user_email=${encodeURIComponent(config.email)}&_t=${ts}`
        : `/api/filesystem/${spaceId}/tree/?user_email=${encodeURIComponent(config.email)}&_t=${ts}`;
    const res = await request(config, 'GET', url);
    return JSON.parse(res.body.toString());
}

export async function downloadFile(config: MantisConfig, spaceId: string, remotePath: string): Promise<Buffer> {
    const url = `/api/filesystem/${spaceId}/download/${remotePath}/?user_email=${encodeURIComponent(config.email)}`;
    const res = await request(config, 'GET', url);
    if (res.status !== 200) {
        throw new Error(`Download failed (${res.status}): ${res.body.toString().slice(0, 200)}`);
    }
    return res.body;
}

export async function uploadFile(config: MantisConfig, spaceId: string, localPath: string, remotePath: string): Promise<void> {
    const url = new URL(`/api/filesystem/${spaceId}/upload/?user_email=${encodeURIComponent(config.email)}`, config.apiHost);
    const isHttps = url.protocol === 'https:';
    const mod = isHttps ? https : http;

    const fileName = path.basename(localPath);
    const fileContent = fs.readFileSync(localPath);
    const boundary = '----MantisUpload' + Date.now();

    const parts: Buffer[] = [];
    // File field
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
    parts.push(fileContent);
    parts.push(Buffer.from('\r\n'));
    // Path field
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
                'X-User-Email': config.email,
            },
        }, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`Upload failed (${res.statusCode}): ${Buffer.concat(chunks).toString().slice(0, 200)}`));
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
