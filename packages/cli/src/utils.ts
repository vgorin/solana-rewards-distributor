import { Keypair, PublicKey } from '@solana/web3.js';
import yargs from 'yargs';
import fs from 'node:fs';
import { ContractCall } from 'programs-wrappers/wrappers/ContractCall';
import { CliContext, TransactionMode } from './context';

const tokenMintArg = 'token-mint';

export function constructPublicKey(pubKey: string, keyType: string): PublicKey {
    const key = new PublicKey(pubKey);
    if (!PublicKey.isOnCurve(key.toBytes())) {
        throw new Error(`Invalid ${keyType} address: ${pubKey}`);
    }
    return key;
}

export function addTokenMintOption(builder: yargs.Argv): yargs.Argv {
    return builder.option(tokenMintArg, {
        demandOption: true,
        type: 'string',
        describe: 'Token mint account address',
    });
}

export function assertHash(hash: Uint8Array): void {
    if (hash.length !== 32) {
        throw new Error(`Invalid hash u8 array size. Expected: 32, actual: ${hash.length}`);
    }
}

export function getTokenMintFromArgs(args: yargs.ArgumentsCamelCase): PublicKey {
    return constructPublicKey(args[tokenMintArg] as string, tokenMintArg);
}

export function readKeypairFromFile(filename: string): Keypair {
    const signerKey = JSON.parse(fs.readFileSync(filename, 'utf-8')) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(signerKey));
}

export function jsonSerialize(value: any): string {
    const replacer = (_: string, data: any) => {
        return typeof data === 'bigint' ? data.toString() : data;
    };
    return JSON.stringify(value, replacer, 2);
}

export async function processTransaction(tx: ContractCall): Promise<void> {
    const mode = CliContext.getTransactionMode();
    if (mode === TransactionMode.Normal) {
        await tx.signAndSend(CliContext.getSigner());
    } else {
        const bytes = await tx.serializeForGovernance();
        console.log(`\nTx calldata to sign: ${bytes}`);
    }
}
