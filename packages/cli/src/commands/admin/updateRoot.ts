import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { assertHash, processTransaction } from '../../utils';
import { CliContext } from '../../context';
import fs from 'node:fs';

const newRootFileArg = 'new-root-file';

export const updateRootCommand: CommandModule = {
    command: 'update-root',
    describe: 'Update RewardDistributor merkle tree root',

    builder: (builder) => {
        return builder.option(newRootFileArg, {
            demandOption: true,
            type: 'string',
            description: 'Path to JSON file containing new root data',
        });
    },
    handler: async (args): Promise<void> => {
        const distributor = CliContext.getRewardsDistributorWrapper();

        const newRoot = loadRootFromFile(args);

        await processTransaction(distributor.updateRoot(newRoot, CliContext.getActualTxSender()));
    },
};

function loadRootFromFile(args: ArgumentsCamelCase): Uint8Array {
    const filename = args[newRootFileArg] as string;
    const hash = JSON.parse(fs.readFileSync(filename, 'utf-8')) as number[];
    const root = Uint8Array.from(hash);
    assertHash(root);

    return root;
}
