import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';

export interface MantisConfig {
    apiHost: string;
    email: string;
    defaultSpaceId: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.mantis');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export function getConfig(): MantisConfig | null {
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return JSON.parse(raw) as MantisConfig;
    } catch {
        return null;
    }
}

export function saveConfig(config: MantisConfig): void {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

export function prompt(question: string, defaultValue?: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    const suffix = defaultValue ? ` [${defaultValue}]` : '';
    return new Promise((resolve) => {
        rl.question(`${question}${suffix}: `, (answer) => {
            rl.close();
            resolve(answer.trim() || defaultValue || '');
        });
    });
}
