import { CommandModule } from 'yargs';
import { constructPublicKey, processTransaction } from '../../utils';
import { CliContext } from '../../context';

const newUpdaterArg = 'new-updater';

export const setUpdaterCommand: CommandModule = {
    command: 'set-updater',
    describe: 'Set RewardDistributor updater',

    builder: (builder) => {
        return builder.option(newUpdaterArg, { demandOption: true, type: 'string', description: 'Updater address' });
    },
    handler: async (args): Promise<void> => {
        const newUpdater = constructPublicKey(args[newUpdaterArg] as string, newUpdaterArg);
        const distributor = CliContext.getRewardsDistributorWrapper();
        await processTransaction(distributor.setUpdater(newUpdater, CliContext.getActualTxSender()));
    },
};
