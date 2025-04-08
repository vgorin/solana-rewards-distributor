import { CommandModule } from 'yargs';
import fs from 'node:fs';

const sizeArg = 'size';
const outputDatasetFileArg = 'output-dataset-file';

export const generateDatasetCommand: CommandModule = {
    command: 'generate-dataset',
    describe: 'Generate a CSV list of addresses and their corresponding airdrop balances',

    builder: (builder) => {
        return builder
            .option(sizeArg, {
                demandOption: true,
                type: 'number',
                description: 'Dataset size; number of records to generate',
            })
            .option(outputDatasetFileArg, {
                demandOption: true,
                type: 'string',
                description: 'Path to an output dataset CSV file to write the generated list to',
            });
    },
    handler: async (args): Promise<void> => {
        const size = args[sizeArg] as number;
        const outputDatasetFilePath = args[outputDatasetFileArg] as string;

        const csvContent = generateSolanaAddressBalancesCSV(size);
        fs.writeFileSync(outputDatasetFilePath, csvContent, 'utf8');
        console.log(`Successfully wrote ${size} addresses and balances to CSV file ${outputDatasetFilePath}`);
    },
};

function generateSolanaAddressBalancesCSV(n: number) {
    let csvContent = "Solana Address,Lamports Balance\n";

    for (let i = 0; i < n; i++) {
        const address = generateSolanaAddress();
        const balance = generateSafeBalance();
        csvContent += `${address},${balance}\n`;
    }

    return csvContent;
}

function generateSolanaAddress() {
    const characters = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = '';
    for (let i = 0; i < 44; i++) {
        address += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return address;
}

function generateSafeBalance() {
    const min = 1000000000;  // Smallest 10-digit number
    const max = 99999999999; // Largest 11-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
