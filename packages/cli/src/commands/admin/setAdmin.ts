import { CommandModule } from 'yargs';
import { constructPublicKey, processTransaction } from '../../utils';
import { CliContext } from '../../context';

const newAdminArg = 'new-admin';

export const setAdminCommand: CommandModule = {
    command: 'set-admin',
    describe: 'Set RewardDistributor admin',

    builder: (builder) => {
        return builder.option(newAdminArg, { demandOption: true, type: 'string', description: 'Admin address' });
    },
    handler: async (args): Promise<void> => {
        const newAdmin = constructPublicKey(args[newAdminArg] as string, newAdminArg);
        const distributor = CliContext.getRewardsDistributorWrapper();
        await processTransaction(distributor.setAdmin(newAdmin, CliContext.getActualTxSender()));
    },
};
