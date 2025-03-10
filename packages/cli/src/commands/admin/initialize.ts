import { CommandModule } from 'yargs';
import { addTokenMintOption, constructPublicKey, getTokenMintFromArgs, processTransaction } from '../../utils';
import { CliContext } from '../../context';

const updaterArg = 'updater';

export const initializeCommand: CommandModule = {
    command: 'initialize',
    describe: 'Initialize the RewardDistributor program',

    builder: (builder) => {
        return addTokenMintOption(builder).option(updaterArg, {
            demandOption: true,
            type: 'string',
            description: 'Updater address',
        });
    },
    handler: async (args): Promise<void> => {
        const tokenMint = getTokenMintFromArgs(args);
        const sender = CliContext.getActualTxSender();
        const updater = constructPublicKey(args[updaterArg] as string, updaterArg);
        const distributor = CliContext.getRewardsDistributorWrapper();

        await processTransaction(await distributor.initialize(sender, updater, tokenMint));
    },
};
