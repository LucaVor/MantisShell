import { Command } from 'commander';
import { loginCommand } from './commands/login';
import { sshCommand } from './commands/ssh';
import { pushCommand } from './commands/push';
import { pullCommand } from './commands/pull';
import { lsCommand } from './commands/ls';
import { runCommand } from './commands/run';
import { useCommand } from './commands/use';

const program = new Command();

program
    .name('mantis')
    .description('CLI for Mantis workspace access')
    .version('0.1.0');

program
    .command('login')
    .description('Configure your Mantis credentials')
    .action(loginCommand);

program
    .command('ssh [space-id]')
    .description('Open a terminal session in your workspace')
    .action(sshCommand);

program
    .command('push <local-path> [remote-path]')
    .description('Upload file(s) to your workspace')
    .action(pushCommand);

program
    .command('pull <remote-path> [local-path]')
    .description('Download file(s) from your workspace')
    .action(pullCommand);

program
    .command('ls [remote-path]')
    .description('List files in your workspace')
    .action(lsCommand);

program
    .command('run <command>')
    .option('-s, --space <space-id>', 'Space ID')
    .description('Run a command in your workspace and stream output')
    .action((command: string, options: { space?: string }) => runCommand(command, options.space));

program
    .command('use <space-id>')
    .description('Set your default space')
    .action(useCommand);

program.parse();
