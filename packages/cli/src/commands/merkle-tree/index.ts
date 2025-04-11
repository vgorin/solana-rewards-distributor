import yargs from 'yargs';
import { generateDatasetCommand } from './generateDataset';
import {generateMerkleTreeCommand} from "./generateMerkleTree";

export function merkleTreeCommandsBuilder(builder: yargs.Argv) {
    return builder
        .command(generateDatasetCommand)
        .command(generateMerkleTreeCommand)
        // demand "3" explicitly requires the command to contain a sub-command defined above
        .demand(3, 'must provide a valid command');
}
