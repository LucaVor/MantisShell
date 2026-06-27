import { Command } from 'commander';
import { sshCommand } from './commands/ssh';
import { pushCommand } from './commands/push';
import { pullCommand } from './commands/pull';
import { lsCommand } from './commands/ls';
import { runCommand } from './commands/run';

const program = new Command();

program
    .name('mantis')
    .description('CLI for Mantis workspace access')
    .version('0.1.0');

program
    .command('ssh <token>')
    .description('Open a terminal session in your workspace')
    .option('-H, --host <host>', 'API host', process.env.MANTIS_HOST || 'http://localhost:8000')
    .action((token: string, options: { host: string }) => sshCommand(token, options.host));

program
    .command('push <local-path> [remote-path]')
    .description('Upload file(s) to your workspace')
    .requiredOption('-t, --token <token>', 'Workspace access token (or set MANTIS_TOKEN env var)', process.env.MANTIS_TOKEN)
    .option('-H, --host <host>', 'API host', process.env.MANTIS_HOST || 'http://localhost:8000')
    .action((localPath: string, remotePath: string | undefined, options: { token: string; host: string }) =>
        pushCommand(localPath, remotePath, options.token, options.host));

program
    .command('pull <remote-path> [local-path]')
    .description('Download file(s) from your workspace')
    .requiredOption('-t, --token <token>', 'Workspace access token (or set MANTIS_TOKEN env var)', process.env.MANTIS_TOKEN)
    .option('-H, --host <host>', 'API host', process.env.MANTIS_HOST || 'http://localhost:8000')
    .action((remotePath: string, localPath: string | undefined, options: { token: string; host: string }) =>
        pullCommand(remotePath, localPath, options.token, options.host));

program
    .command('ls [remote-path]')
    .description('List files in your workspace')
    .requiredOption('-t, --token <token>', 'Workspace access token (or set MANTIS_TOKEN env var)', process.env.MANTIS_TOKEN)
    .option('-H, --host <host>', 'API host', process.env.MANTIS_HOST || 'http://localhost:8000')
    .action((remotePath: string | undefined, options: { token: string; host: string }) =>
        lsCommand(remotePath, options.token, options.host));

program
    .command('run <command>')
    .description('Run a command in your workspace and stream output')
    .requiredOption('-t, --token <token>', 'Workspace access token (or set MANTIS_TOKEN env var)', process.env.MANTIS_TOKEN)
    .option('-H, --host <host>', 'API host', process.env.MANTIS_HOST || 'http://localhost:8000')
    .action((command: string, options: { token: string; host: string }) =>
        runCommand(command, options.token, options.host));

program.parse();
