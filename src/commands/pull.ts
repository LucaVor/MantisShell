import * as fs from 'fs';
import * as path from 'path';
import { getConfig } from '../config';
import { downloadFile } from '../api';

export async function pullCommand(remotePath: string, localPath?: string): Promise<void> {
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

    const dest = localPath || path.basename(remotePath);
    const content = await downloadFile(config, spaceId, remotePath);

    const resolvedDest = path.resolve(dest);
    const destDir = path.dirname(resolvedDest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    fs.writeFileSync(resolvedDest, content);
    console.log(`Pulled workspace:/${remotePath} → ${resolvedDest} (${content.length} bytes)`);
}
