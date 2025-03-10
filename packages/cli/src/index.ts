import yargs from 'yargs';
import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js';
import { adminCommandsBuilder } from './commands/admin';
import { userCommandsBuilder } from './commands/user';
import { CliContext, TransactionMode } from './context';
import { readKeypairFromFile } from './utils';
import { readCommandsBuilder } from './commands/read-only';

const modeArg = 'mode';
const privateKeyFileArg = 'private-key-file';
const txSenderArg = 'tx-sender';
const clusterArg = 'cluster';
const localnet = 'localnet';
const localNodeUrl = 'http://127.0.0.1:8899';

async function main(): Promise<void> {
    yargs
        // commands by category
        .command('admin', 'Admin actions', adminCommandsBuilder)
        .command('user', 'User actions', userCommandsBuilder)
        .command('read', 'Read actions', readCommandsBuilder)
        // common args
        .option(modeArg, {
            type: 'string',
            choices: Object.keys(TransactionMode),
            default: TransactionMode.Normal,
            description:
                'Transaction processing mode. `Normal` mode is base cases: read data. ' +
                '`Normal` - the simple sign and send strategy with `--private-key-file <filename>` key. ' +
                '`CalldataOnly` - admin methods multisig tx calldata generation, the `--tx-sender <address>` arg is required.',
        })
        .option(privateKeyFileArg, {
            type: 'string',
            description:
                'Path of file with signer secret key (array of bytes). ' +
                'Used in `--mode Normal` only, can be omitted otherwise. ' +
                'In base case you should use this: "~/.config/solana/id.json"',
        })
        .option(txSenderArg, {
            type: 'string',
            description:
                'The Public key of a multisig that will sign generated calldata for governance calldata. ' +
                'Used in `--mode CalldataOnly` only, can be omitted otherwise.',
        })
        .option(clusterArg, {
            demandOption: true,
            type: 'string',
            choices: [localnet, 'devnet', 'testnet', 'mainnet-beta'],
            default: localnet,
            description: 'Chain selector',
        })
        .check((commonArgs) => {
            const mode = TransactionMode[commonArgs[modeArg]];
            console.log(`Mode: '${mode}'`);
            CliContext.setTransactionMode(mode);

            const privateKeyFile = commonArgs[privateKeyFileArg];

            if (mode === TransactionMode.Normal && privateKeyFile !== undefined) {
                const keypair = readKeypairFromFile(privateKeyFile);
                console.log(`Signer: ${keypair.publicKey}`);
                CliContext.setSigner(keypair);
            } else if (mode === TransactionMode.CalldataOnly) {
                if (privateKeyFile !== undefined) {
                    throw new Error(`\`--${privateKeyFileArg}\` should not be provided for the \`CalldataOnly\` mode`);
                }
                const txSender = commonArgs[txSenderArg];
                if (txSender === undefined) {
                    throw new Error(`\`--${txSenderArg}\` must be provided for the \`CalldataOnly\` mode`);
                }
                console.log(`TxSender: ${txSender}`);
                CliContext.setTxSender(txSender);
            }

            const cluster = commonArgs[clusterArg] as string;
            const nodeUrl = cluster === localnet ? localNodeUrl : clusterApiUrl(cluster as Cluster);
            const connection = new Connection(nodeUrl, 'confirmed');

            console.log(`Cluster: ${cluster}`);
            console.log(`Node url: ${nodeUrl}`);
            CliContext.setConnection(connection);
            return true;
        })
        .demand(2, 'must provide a valid command')
        .help('h')
        .alias('h', 'help')
        .parse();
}

main();
