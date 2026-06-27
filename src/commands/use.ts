import { getConfig, saveConfig } from '../config';

export function useCommand(spaceId: string): void {
    const config = getConfig();
    if (!config) {
        console.error('Not logged in. Run `mantis login` first.');
        process.exit(1);
    }

    config.defaultSpaceId = spaceId;
    saveConfig(config);
    console.log(`Default space set to: ${spaceId}`);
}
