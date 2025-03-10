import { CommandModule } from 'yargs';
import { CliContext } from '../../context';

export const readDistributorConfigCommand: CommandModule = {
    command: 'config',
    describe: 'Read rewards distributor config',

    builder: (builder) => {
        return builder;
    },
    handler: async (args): Promise<void> => {
        const distributor = CliContext.getRewardsDistributorWrapper();
        const cfg = await distributor.getDistributorConfig();
        const rootHex = '0x' + Buffer.from(Uint8Array.from(cfg.root)).toString('hex');

        const preparedConfig = {
            mint: cfg.mint.toBase58(),
            tokenVault: cfg.tokenVault.toBase58(),
            admin: cfg.admin.toBase58(),
            updater: cfg.updater.toBase58(),
            shutdown: cfg.shutdown,
            root: '[' + cfg.root.join(', ') + ']',
            rootHex,
        };

        console.log(`Config: ${JSON.stringify(preparedConfig, null, 2)}`);
    },
};
