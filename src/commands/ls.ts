import { getConfig } from '../config';
import { fetchTree } from '../api';

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
}

export async function lsCommand(remotePath?: string): Promise<void> {
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

    const tree = await fetchTree(config, spaceId, remotePath) as FileNode[];

    if (tree.length === 0) {
        console.log('(empty)');
        return;
    }

    for (const node of tree) {
        if (node.type === 'directory') {
            console.log(`\x1b[34m${node.name}/\x1b[0m`);
        } else {
            const size = node.size ? formatSize(node.size) : '';
            console.log(`  ${node.name}${size ? `  (${size})` : ''}`);
        }
    }
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
