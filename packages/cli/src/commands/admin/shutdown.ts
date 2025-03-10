import { CommandModule } from 'yargs';
import { addTokenMintOption, getTokenMintFromArgs, processTransaction } from '../../utils';
import { CliContext } from '../../context';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export const shutdownCommand: CommandModule = {
    command: 'shutdown',
    describe: 'Shutdown RewardDistributor',

    builder: (builder) => {
        return addTokenMintOption(builder);
    },
    handler: async (args): Promise<void> => {
        const tokenMint = getTokenMintFromArgs(args);

        const distributor = CliContext.getRewardsDistributorWrapper();

        const signer = CliContext.getActualTxSender();
        const adminATA = await getAssociatedTokenAddress(tokenMint, signer);

        await processTransaction(distributor.shutdown(signer, adminATA));
    },
};
