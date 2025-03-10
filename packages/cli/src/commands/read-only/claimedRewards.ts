import { CommandModule } from 'yargs';
import { CliContext } from '../../context';
import { constructPublicKey } from '../../utils';

const claimantArg = 'claimant';

export const readClaimedRewardsCommand: CommandModule = {
    command: 'claimed-rewards',
    describe: 'Read claimed rewards',

    builder: (builder) => {
        return builder.option(claimantArg, { demandOption: true, type: 'string', description: 'Claimant address' });
    },
    handler: async (args): Promise<void> => {
        const claimant = constructPublicKey(args[claimantArg] as string, claimantArg);

        const distributor = CliContext.getRewardsDistributorWrapper();
        const claimedRewards = await distributor.getClaimedRewards(claimant);

        console.log(`Claimed rewards: ${claimedRewards.claimed.toString(10)}`);
    },
};
