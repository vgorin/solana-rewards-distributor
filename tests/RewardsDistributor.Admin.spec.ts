import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { RewardsDistributor } from '../target/types/rewards_distributor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { expect } from 'chai';
import {
    expectRevert,
    createTokenMint,
    requestSolana,
    initializeATA,
    mintTokenTo,
    transferTokens,
} from './shared/transactions';
import {
    DISTRIBUTOR_CONFIG_SEED,
    ELIGIBLE_USER_AMOUNT,
    ELIGIBLE_USER_PK,
    ErrorCode,
    MERKLE_ROOT,
} from './shared/consts';

describe('Rewards distributor Admin', () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    const connection = anchor.getProvider().connection;

    const program = anchor.workspace.RewardsDistributor as Program<RewardsDistributor>;

    const config = program.account.distributorConfig;
    const [configPda] = PublicKey.findProgramAddressSync([DISTRIBUTOR_CONFIG_SEED], program.programId);

    const admin = Keypair.generate();
    const updater = Keypair.generate();
    const unauthorized = Keypair.generate();
    let mint: PublicKey;

    before(async () => {
        await requestSolana(connection, 1000, admin.publicKey);
        await requestSolana(connection, 1000, updater.publicKey);
        await requestSolana(connection, 1000, unauthorized.publicKey);

        mint = await createTokenMint(connection, admin);
        await initializeATA(anchor.getProvider(), admin, mint);
        await mintTokenTo(connection, admin, mint, admin.publicKey, ELIGIBLE_USER_AMOUNT * 2);
    });

    it('Initialize', async () => {
        await program.methods
            .initialize(updater.publicKey)
            .accounts({
                mint: mint,
                admin: admin.publicKey,
            })
            .signers([admin])
            .rpc();

        const configData = await config.fetch(configPda);

        expect(configData.root).to.deep.eq(new Array(32).fill(0));
        expect(configData.mint).to.deep.eq(mint);

        const vault = await getAssociatedTokenAddress(mint, configPda, true);
        expect(configData.tokenVault).to.deep.eq(vault);

        expect(configData.admin).to.deep.eq(admin.publicKey);
        expect(configData.updater).to.deep.eq(updater.publicKey);
        expect(configData.shutdown).to.be.eq(false);
    });

    it('Add funds', async () => {
        const vault = await getAssociatedTokenAddress(mint, configPda, true);
        const balanceBefore = (await getAccount(connection, vault)).amount;

        const transferAmount = ELIGIBLE_USER_AMOUNT * 2;
        await transferTokens(anchor.getProvider(), mint, admin, vault, transferAmount);

        const balanceAfter = (await getAccount(connection, vault)).amount;
        expect(balanceAfter - balanceBefore).to.be.eq(BigInt(transferAmount));
    });

    it('Update root', async () => {
        const newRoot = [...MERKLE_ROOT];
        await program.methods
            .updateRoot(newRoot)
            .accounts({
                updater: updater.publicKey,
            })
            .signers([updater])
            .rpc();

        const configData = await config.fetch(configPda);

        expect(configData.root).to.deep.eq(newRoot);
    });

    it('Update root, SameValue', async () => {
        const tx = program.methods
            .updateRoot([...MERKLE_ROOT])
            .accounts({
                updater: updater.publicKey,
            })
            .signers([updater])
            .rpc();

        await expectRevert(tx, ErrorCode.SameValue);
    });

    it('Update root, unauthorized', async () => {
        const newRoot = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
        const tx = program.methods
            .updateRoot(newRoot)
            .accounts({
                updater: unauthorized.publicKey,
            })
            .signers([unauthorized])
            .rpc();

        await expectRevert(tx, ErrorCode.Unauthorized);
    });

    it('Set updater, SameValue', async () => {
        const tx = program.methods
            .setUpdater(updater.publicKey)
            .accounts({
                admin: admin.publicKey,
            })
            .signers([admin])
            .rpc();

        await expectRevert(tx, ErrorCode.SameValue);
    });

    it('Set updater', async () => {
        const newUpdater = Keypair.fromSecretKey(ELIGIBLE_USER_PK);
        await program.methods
            .setUpdater(newUpdater.publicKey)
            .accounts({
                admin: admin.publicKey,
            })
            .signers([admin])
            .rpc();

        const configData = await config.fetch(configPda);

        expect(configData.updater).to.deep.eq(newUpdater.publicKey);
    });

    it('Set updater, unauthorized', async () => {
        const tx = program.methods
            .setUpdater(unauthorized.publicKey)
            .accounts({
                admin: unauthorized.publicKey,
            })
            .signers([unauthorized])
            .rpc();

        await expectRevert(tx, ErrorCode.Unauthorized);
    });

    it('Set admin, SameValue', async () => {
        const tx = program.methods
            .setAdmin(admin.publicKey)
            .accounts({
                admin: admin.publicKey,
            })
            .signers([admin])
            .rpc();

        await expectRevert(tx, ErrorCode.SameValue);
    });


    it('Set admin', async () => {
        const newAdmin = Keypair.fromSecretKey(ELIGIBLE_USER_PK);
        await program.methods
            .setAdmin(newAdmin.publicKey)
            .accounts({
                admin: admin.publicKey,
            })
            .signers([admin])
            .rpc();

        const configData = await config.fetch(configPda);

        expect(configData.admin).to.deep.eq(newAdmin.publicKey);
    });

    it('Set admin, unauthorized', async () => {
        const tx = program.methods
            .setAdmin(unauthorized.publicKey)
            .accounts({
                admin: unauthorized.publicKey,
            })
            .signers([unauthorized])
            .rpc();

        await expectRevert(tx, ErrorCode.Unauthorized);
    });
});
