import * as fs from 'fs';
import * as path from 'path';
import { downloadFile } from '../api';

export async function pullCommand(remotePath: string, localPath: string | undefined, token: string, host: string): Promise<void> {
    const dest = localPath || path.basename(remotePath);
    const content = await downloadFile(token, host, remotePath);

    const resolvedDest = path.resolve(dest);
    const destDir = path.dirname(resolvedDest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    fs.writeFileSync(resolvedDest, content);
    console.log(`Pulled ${remotePath} (${content.length} bytes)`);
}
