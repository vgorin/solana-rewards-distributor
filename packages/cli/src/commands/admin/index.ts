import yargs from 'yargs';
import { initializeCommand } from './initialize';
import { setAdminCommand } from './setAdmin';
import { setUpdaterCommand } from './setUpdater';
import { shutdownCommand } from './shutdown';
import { updateRootCommand } from './updateRoot';

export function adminCommandsBuilder(builder: yargs.Argv) {
    return builder
        .command(initializeCommand)
        .command(setAdminCommand)
        .command(setUpdaterCommand)
        .command(shutdownCommand)
        .command(updateRootCommand)
        .demand(3, 'must provide a valid command');
}
