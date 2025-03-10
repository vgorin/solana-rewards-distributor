import yargs from 'yargs';
import { claimCommand } from './claim';

export function userCommandsBuilder(builder: yargs.Argv) {
    return builder.command(claimCommand).demand(3, 'must provide a valid command');
}
