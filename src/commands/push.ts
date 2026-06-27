import * as fs from 'fs';
import * as path from 'path';
import { getConfig } from '../config';
import { uploadFile } from '../api';

export async function pushCommand(localPath: string, remotePath?: string): Promise<void> {
    const config = getConfig();
    if (!config || !config.email) {
        console.error('Not logged in. Run `mantis login` first.');
        process.exit(1);
    }

    const spaceId = config.defaultSpaceId;
    if (!spaceId) {
        console.error('No default space. Run `mantis use <space-id>` first.');
        process.exit(1);
    }

    const resolvedLocal = path.resolve(localPath);
    if (!fs.existsSync(resolvedLocal)) {
        console.error(`File not found: ${resolvedLocal}`);
        process.exit(1);
    }

    const stat = fs.statSync(resolvedLocal);
    if (stat.isDirectory()) {
        // Recursive upload
        const files = getAllFiles(resolvedLocal);
        const baseDir = resolvedLocal;
        for (const file of files) {
            const relPath = path.relative(baseDir, file);
            const target = remotePath ? `${remotePath}/${relPath}` : relPath;
            process.stderr.write(`  Uploading ${relPath}...\n`);
            await uploadFile(config, spaceId, file, path.dirname(target));
        }
        console.log(`Pushed ${files.length} file(s) from ${localPath}`);
    } else {
        const target = remotePath || '';
        await uploadFile(config, spaceId, resolvedLocal, target);
        console.log(`Pushed ${path.basename(localPath)} → workspace:/${target ? target + '/' : ''}${path.basename(localPath)}`);
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
