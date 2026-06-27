import { getConfig, saveConfig, prompt } from '../config';

export async function loginCommand(): Promise<void> {
    const existing = getConfig();

    console.log('Mantis CLI — Login\n');

    const email = await prompt('Email', existing?.email);
    const apiHost = await prompt('API Host', existing?.apiHost || 'http://localhost:8000');
    const defaultSpaceId = await prompt('Default Space ID (optional)', existing?.defaultSpaceId);

    if (!email) {
        console.error('Email is required.');
        process.exit(1);
    }

    saveConfig({ email, apiHost, defaultSpaceId });
    console.log(`\nSaved to ~/.mantis/config.json`);
    console.log(`  Email: ${email}`);
    console.log(`  API Host: ${apiHost}`);
    if (defaultSpaceId) console.log(`  Default Space: ${defaultSpaceId}`);
    console.log('\nRun `mantis ssh` to connect to your workspace.');
}
