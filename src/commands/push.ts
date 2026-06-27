import * as fs from 'fs';
import * as path from 'path';
import { uploadFile } from '../api';

export async function pushCommand(localPath: string, remotePath: string | undefined, token: string, host: string): Promise<void> {
    const resolvedLocal = path.resolve(localPath);
    if (!fs.existsSync(resolvedLocal)) {
        console.error(`File not found: ${resolvedLocal}`);
        process.exit(1);
    }

    const stat = fs.statSync(resolvedLocal);
    if (stat.isDirectory()) {
        const files = getAllFiles(resolvedLocal);
        for (const file of files) {
            const relPath = path.relative(resolvedLocal, file);
            const target = remotePath ? `${remotePath}/${relPath}` : relPath;
            process.stderr.write(`  Uploading ${relPath}...\n`);
            await uploadFile(token, host, file, path.dirname(target));
        }
        console.log(`Pushed ${files.length} file(s)`);
    } else {
        await uploadFile(token, host, resolvedLocal, remotePath || '');
        console.log(`Pushed ${path.basename(localPath)}`);
    }
}

function getAllFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...getAllFiles(full));
        } else {
            results.push(full);
        }
    }
    return results;
}
