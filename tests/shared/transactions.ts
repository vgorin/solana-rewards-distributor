import { createMint } from '@solana/spl-token';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { DEFAULT_TOKEN_DECIMALS } from './consts';
import { expect } from 'chai';

export async function expectRevert(tx: Promise<string>, expectedError?: string) {
    try {
        await tx;
    } catch (error) {
        if (expectedError) {
            expect(error.toString()).includes(`Error Code: ${expectedError}`);
        }
        return;
    }
    throw new Error("Transaction didn't revert");
}

export async function requestSolana(connection: Connection, solAmount: number, to: PublicKey) {
    const airdropSignature = await connection.requestAirdrop(to, solAmount * LAMPORTS_PER_SOL);
    await confirmTransaction(connection, airdropSignature);
}

export async function createTokenMint(
    connection: Connection,
    authority: Keypair,
    decimals: number = DEFAULT_TOKEN_DECIMALS
): Promise<PublicKey> {
    return createMint(connection, authority, authority.publicKey, authority.publicKey, decimals);
}

export async function confirmTransaction(connection: Connection, txSignature: string) {
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txSignature,
    });
}
