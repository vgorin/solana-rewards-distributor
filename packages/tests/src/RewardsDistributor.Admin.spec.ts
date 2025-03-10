import * as anchor from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { expect } from 'chai';
import {
    createTokenMint,
    expectRevert,
    initializeATA,
    mintTokenTo,
    requestSolana,
    transferTokens,
} from './shared/transactions';
import { ELIGIBLE_USER_AMOUNT, ELIGIBLE_USER_PK, ErrorCode, MERKLE_ROOT } from './shared/consts';
import { getLocalEnvSigner } from './shared/utils';
import { RewardsDistributorWrapper } from 'programs-wrappers/wrappers/RewardsDistributorWrapper';

describe('Rewards distributor Admin', () => {
    anchor.setProvider(anchor.AnchorProvider.local());
    const connection = anchor.getProvider().connection;

    const distributor = new RewardsDistributorWrapper(anchor.getProvider());

    const admin = getLocalEnvSigner();
    expect(admin.publicKey).to.deep.eq(anchor.AnchorProvider.env().publicKey);

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
        await (await distributor.initialize(admin.publicKey, updater.publicKey, mint)).signAndSend(admin);
        const configData = await distributor.getDistributorConfig();

        expect(configData.root).to.deep.eq(new Array(32).fill(0));
        expect(configData.mint).to.deep.eq(mint);

        const vault = await getAssociatedTokenAddress(mint, distributor.getDistributorConfigAddress(), true);
        expect(configData.tokenVault).to.deep.eq(vault);

        expect(configData.admin).to.deep.eq(admin.publicKey);
        expect(configData.updater).to.deep.eq(updater.publicKey);
        expect(configData.shutdown).to.be.eq(false);
    });

    it('Add funds', async () => {
        const vault = await getAssociatedTokenAddress(mint, distributor.getDistributorConfigAddress(), true);
        const balanceBefore = (await getAccount(connection, vault)).amount;

        const transferAmount = ELIGIBLE_USER_AMOUNT * 2;
        await transferTokens(anchor.getProvider(), mint, admin, vault, transferAmount);

        const balanceAfter = (await getAccount(connection, vault)).amount;
        expect(balanceAfter - balanceBefore).to.be.eq(BigInt(transferAmount));
    });

    it('Update root', async () => {
        const newRoot = [...MERKLE_ROOT];
        await distributor.updateRoot(newRoot, updater.publicKey).signAndSend(updater);

        const configData = await distributor.getDistributorConfig();

        expect(configData.root).to.deep.eq(newRoot);
    });

    it('Update root, SameValue', async () => {
        await expectRevert(
            distributor.updateRoot([...MERKLE_ROOT], updater.publicKey).signAndSend(updater),
            ErrorCode.SameValue
        );
    });

    it('Update root, unauthorized', async () => {
        const newRoot = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
        await expectRevert(
            distributor.updateRoot(newRoot, unauthorized.publicKey).signAndSend(unauthorized),
            ErrorCode.Unauthorized
        );
    });

    it('Set updater, SameValue', async () => {
        await expectRevert(
            distributor.setUpdater(updater.publicKey, admin.publicKey).signAndSend(admin),
            ErrorCode.SameValue
        );
    });

    it('Set updater', async () => {
        const newUpdater = Keypair.fromSecretKey(ELIGIBLE_USER_PK);
        await distributor.setUpdater(newUpdater.publicKey, admin.publicKey).signAndSend(admin);
        const configData = await distributor.getDistributorConfig();

        expect(configData.updater).to.deep.eq(newUpdater.publicKey);
    });

    it('Set updater, unauthorized', async () => {
        await expectRevert(
            distributor.setUpdater(unauthorized.publicKey, unauthorized.publicKey).signAndSend(unauthorized),
            ErrorCode.Unauthorized
        );
    });

    it('Set admin, SameValue', async () => {
        await expectRevert(
            distributor.setAdmin(admin.publicKey, admin.publicKey).signAndSend(admin),
            ErrorCode.SameValue
        );
    });

    it('Set admin', async () => {
        const newAdmin = Keypair.fromSecretKey(ELIGIBLE_USER_PK);
        await distributor.setAdmin(newAdmin.publicKey, admin.publicKey).signAndSend(admin);

        const configData = await distributor.getDistributorConfig();

        expect(configData.admin).to.deep.eq(newAdmin.publicKey);
    });

    it('Set admin, unauthorized', async () => {
        await expectRevert(
            distributor.setAdmin(unauthorized.publicKey, unauthorized.publicKey).signAndSend(unauthorized),
            ErrorCode.Unauthorized
        );
    });
});
