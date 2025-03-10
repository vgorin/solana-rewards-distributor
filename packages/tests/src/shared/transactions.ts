import {
    createAssociatedTokenAccountInstruction,
    createMint,
    createTransferInstruction,
    getAssociatedTokenAddress,
    mintTo,
} from '@solana/spl-token';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { DEFAULT_TOKEN_DECIMALS } from './consts';
import { expect } from 'chai';
import { Provider } from '@coral-xyz/anchor';

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

export async function mintTokenTo(
    connection: Connection,
    authority: Keypair,
    mint: PublicKey,
    to: PublicKey,
    amount: number
) {
    const ata = await getAssociatedTokenAddress(mint, to);
    const txSignature = await mintTo(connection, authority, mint, ata, authority, amount);
    await confirmTransaction(connection, txSignature);
}

export async function transferTokens(
    provider: Provider,
    mint: PublicKey,
    sender: Keypair,
    to: PublicKey,
    amount: number
) {
    const tx = new Transaction();

    const transferInstruction = createTransferInstruction(
        await getAssociatedTokenAddress(mint, sender.publicKey),
        to,
        sender.publicKey,
        amount
    );
    tx.add(transferInstruction);

    const txSignature = await provider.sendAndConfirm(tx, [sender]);
    await confirmTransaction(provider.connection, txSignature);
}

export async function initializeATA(provider: Provider, owner: Keypair, mint: PublicKey): Promise<PublicKey> {
    const ataAddress = await getAssociatedTokenAddress(mint, owner.publicKey);
    if (await provider.connection.getAccountInfo(ataAddress)) {
        // associated token account is already initialized
        return ataAddress;
    }

    const instruction = createAssociatedTokenAccountInstruction(owner.publicKey, ataAddress, owner.publicKey, mint);
    const tx = new Transaction().add(instruction);
    const txSignature = await provider.sendAndConfirm(tx, [owner]);
    await confirmTransaction(provider.connection, txSignature);
    return ataAddress;
}

export async function confirmTransaction(connection: Connection, txSignature: string) {
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txSignature,
    });
}
