import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { CliContext } from '../../context';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import fs from 'node:fs';
import { assertHash, processTransaction } from '../../utils';

const totalAmountArg = 'total-amount';
const proofFileArg = 'proof-file';

export const claimCommand: CommandModule = {
    command: 'claim',
    describe: 'Claim rewards',

    builder: (builder) => {
        return builder
            .option(totalAmountArg, { demandOption: true, type: 'string', description: 'Total amount' })
            .option(proofFileArg, { demandOption: true, type: 'string', description: 'Proof u8[][] file' });
    },
    handler: async (args): Promise<void> => {
        const totalAmount = BigInt(args[totalAmountArg] as string);
        console.log('total:', totalAmount.toString());
        const proof = loadProofFromFile(args);

        const distributor = CliContext.getRewardsDistributorWrapper();
        const signer = CliContext.getSigner();

        const config = await distributor.getDistributorConfig();
        const toATA = await getAssociatedTokenAddress(config.mint, signer.publicKey);

        await processTransaction(distributor.claim(signer.publicKey, toATA, totalAmount, proof));
    },
};

function loadProofFromFile(args: ArgumentsCamelCase): Uint8Array[] {
    const result: Uint8Array[] = [];
    const proof = JSON.parse(fs.readFileSync(args[proofFileArg] as string, 'utf-8')) as number[][];

    for (const elem of proof) {
        const hash = Uint8Array.from(elem);

        assertHash(hash);

        result.push(hash);
    }

    return result;
}
