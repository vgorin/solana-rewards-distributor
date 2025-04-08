import {CommandModule} from 'yargs';
import { MerkleTree } from 'merkletreejs';
import { createHash } from 'crypto';
import bs58 from 'bs58';
import fs from 'node:fs';
import path from 'path';

const inputDatasetFileArg = 'input-dataset-file';
const outputMerkleRootFileArg = 'output-merkle-root-file';
const outputMerkleProofFolderArg = 'output-merkle-proof-folder';

export const generateMerkleTreeCommand: CommandModule = {
    command: 'generate-merkle-tree',
    describe: 'Generate a Merkle tree (root + proofs) for the list of addresses and their corresponding airdrop balances',

    builder: (builder) => {
        return builder
            .option(inputDatasetFileArg, {
                demandOption: true,
                type: 'string',
                description: 'Path to an input dataset CSV file to read the airdrop (Solana Address, Lamports Balance) list from',
            })
            .option(outputMerkleRootFileArg, {
                demandOption: true,
                type: 'string',
                description: 'Path to an output Merkle root JSON file to write Merkle root for the dataset to'
            })
            .option(outputMerkleProofFolderArg, {
                demandOption: true,
                type: 'string',
                description: 'Path to an output Merkle proof folder to write Merkle proof JSON files to',
            });
    },
    handler: async (args): Promise<void> => {
        const inputDatasetFilePath = args[inputDatasetFileArg] as string;
        const outputMerkleRootFilePath = args[outputMerkleRootFileArg] as string;
        const outputMerkleProofFolderPath = args[outputMerkleProofFolderArg] as string;

        const dataset = readDatasetFile(inputDatasetFilePath);
        const {merkleRoot, merkleProofs} = generateMerkleData(dataset);

        // Save Merkle root
        const merkleRootBytes = Array.from(merkleRoot);
        fs.writeFileSync(outputMerkleRootFilePath, JSON.stringify(merkleRootBytes, null, 2));
        console.log(`Merkle root saved to ${outputMerkleRootFilePath}`);

        // Create output directory if it doesn't exist
        fs.mkdirSync(outputMerkleProofFolderPath, { recursive: true });

        // Save Merkle proofs
        merkleProofs.forEach((proof, i) => {
            const proofFilePath = path.join(outputMerkleProofFolderPath, `${dataset[i].SolanaAddress}.json`);
            const jsonProof = proof.map(buffer => Array.from(buffer));
            fs.writeFileSync(proofFilePath, JSON.stringify(jsonProof, null, 2));
            console.log(`Merkle Proof for ${dataset[i].SolanaAddress} saved to ${proofFilePath}`);
        });
    },
}

interface DatasetRecord {
    SolanaAddress: string;
    LamportsBalance: string;
}

function hash(data: Buffer) {
    return createHash('sha256').update(data).digest();
}

function hashLeaf(address: string, balance: string): Buffer {
    const addressBuffer = bs58.decode(address);
    const balanceBuffer = Buffer.from(BigInt(balance).toString(16).padStart(16, '0'), 'hex');
    const combinedBuffer = Buffer.concat([addressBuffer, balanceBuffer]);
    return hash(combinedBuffer);
}

function readDatasetFile(datasetFilePath: string): DatasetRecord[] {
    const fileContent = fs.readFileSync(datasetFilePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    const header = lines[0].split(',');
    const dataRows = lines.slice(1);

    if (header.length !== 2 || header[0] !== 'Solana Address' || header[1] !== 'Lamports Balance') {
        throw 'Invalid CSV header format.';
    }

    return dataRows.map(row => {
        const [SolanaAddress, LamportsBalance] = row.split(',');
        return {SolanaAddress: SolanaAddress.trim(), LamportsBalance: LamportsBalance.trim()};
    });
}

function generateMerkleData(dataset: DatasetRecord[]): { merkleRoot: Buffer | null; merkleProofs: Buffer[][] } {
    if (dataset.length === 0) {
        return { merkleRoot: null, merkleProofs: [] };
    }
    const leaves = dataset.map(entry => hashLeaf(entry.SolanaAddress, entry.LamportsBalance));
    const tree = new MerkleTree(leaves, (data: Buffer) => hash(data), {
        hashLeaves: true, // default is false; directly affects Solana proof verification part
        sortPairs: true, // default is false; directly affects Solana proof verification part
        sortLeaves: true, // default is false; doesn't directly affect Solana proof verification part
        duplicateOdd: false, // default is false; directly affects Solana proof verification part
    });
    const root = tree.getRoot();

    const merkleProofs: Buffer[][] = leaves.map(leaf => { // Iterate over leaves directly
        return tree.getProof(hash(leaf)).map(element => element.data); // Directly use element.data
    });

    return { merkleRoot: root, merkleProofs };
}
