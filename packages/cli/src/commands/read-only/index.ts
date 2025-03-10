import yargs from 'yargs';
import { readDistributorConfigCommand } from './config';
import { readClaimedRewardsCommand } from './claimedRewards';

export function readCommandsBuilder(builder: yargs.Argv) {
    return builder
        .command(readDistributorConfigCommand)
        .command(readClaimedRewardsCommand)
        .demand(3, 'must provide a valid command');
}
