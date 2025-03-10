import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { expect } from 'chai';
import { expectRevert, initializeATA, requestSolana } from './shared/transactions';
import { ELIGIBLE_USER_AMOUNT, ELIGIBLE_USER_PK, ErrorCode, MERKLE_PROOF } from './shared/consts';
import { hashAirdropLeaf } from './shared/utils';
import { RewardsDistributorWrapper } from 'programs-wrappers/wrappers/RewardsDistributorWrapper';

describe('Rewards distributor Claim', () => {
    const connection = anchor.getProvider().connection;

    const distributor = new RewardsDistributorWrapper(anchor.getProvider());

    const user = Keypair.fromSecretKey(ELIGIBLE_USER_PK);
    const userIneligible = Keypair.generate();
    let mint: PublicKey;
    let userATA: PublicKey;

    before(async () => {
        await requestSolana(connection, 1000, user.publicKey);
        await requestSolana(connection, 1000, userIneligible.publicKey);
        const configData = await distributor.getDistributorConfig();
        mint = configData.mint;
        userATA = await initializeATA(anchor.getProvider(), user, mint);
        await initializeATA(anchor.getProvider(), userIneligible, mint);
    });

    it('Claim', async () => {
        const vault = await getAssociatedTokenAddress(mint, distributor.getDistributorConfigAddress(), true);
        const vaultBalanceBefore = (await getAccount(connection, vault)).amount;
        const userBalanceBefore = (await getAccount(connection, userATA)).amount;

        await distributor.claim(user.publicKey, userATA, new BN(ELIGIBLE_USER_AMOUNT), MERKLE_PROOF).signAndSend(user);
        const vaultBalanceAfter = (await getAccount(connection, vault)).amount;
        expect(vaultBalanceBefore - vaultBalanceAfter).to.be.eq(BigInt(ELIGIBLE_USER_AMOUNT));

        const userBalanceAfter = (await getAccount(connection, userATA)).amount;
        expect(userBalanceAfter - userBalanceBefore).to.be.eq(BigInt(ELIGIBLE_USER_AMOUNT));

        const claimedRewardsData = await distributor.getClaimedRewards(user.publicKey);
        expect(claimedRewardsData.claimed.eq(new BN(ELIGIBLE_USER_AMOUNT))).to.be.true;
    });

    it('Claim, InvalidProof', async () => {
        await expectRevert(
            distributor
                .claim(
                    userIneligible.publicKey,
                    await getAssociatedTokenAddress(mint, userIneligible.publicKey),
                    new BN(ELIGIBLE_USER_AMOUNT),
                    MERKLE_PROOF
                )
                .signAndSend(userIneligible),
            ErrorCode.InvalidProof
        );
    });

    it('Claim, second one after root update', async () => {
        const vault = await getAssociatedTokenAddress(mint, distributor.getDistributorConfigAddress(), true);
        const vaultBalanceBefore = (await getAccount(connection, vault)).amount;
        const userBalanceBefore = (await getAccount(connection, userATA)).amount;

        const updatedAmount = ELIGIBLE_USER_AMOUNT * 2;
        const newRoot = hashAirdropLeaf(user.publicKey, updatedAmount);

        await distributor.updateRoot(newRoot, user.publicKey).signAndSend(user);
        await distributor.claim(user.publicKey, userATA, new BN(updatedAmount), []).signAndSend(user);

        const expectedDelta = updatedAmount - ELIGIBLE_USER_AMOUNT;

        const vaultBalanceAfter = (await getAccount(connection, vault)).amount;
        expect(vaultBalanceBefore - vaultBalanceAfter).to.be.eq(BigInt(expectedDelta));

        const userBalanceAfter = (await getAccount(connection, userATA)).amount;
        expect(userBalanceAfter - userBalanceBefore).to.be.eq(BigInt(expectedDelta));

        const claimedRewardsData = await distributor.getClaimedRewards(user.publicKey);
        expect(claimedRewardsData.claimed.eq(new BN(updatedAmount))).to.be.true;
    });

    it('Claim, AlreadyClaimed', async () => {
        // const claimTx = program.methods
        //     .claim(new BN(ELIGIBLE_USER_AMOUNT * 2), [])
        //     .accounts({ to: userATA, claimant: user.publicKey })
        //     .signers([user])
        //     .rpc();

        await expectRevert(
            distributor.claim(user.publicKey, userATA, new BN(ELIGIBLE_USER_AMOUNT * 2), []).signAndSend(user),
            ErrorCode.AlreadyClaimed
        );
    });

    it('Claim, InsufficientBalance', async () => {
        const updatedAmount = ELIGIBLE_USER_AMOUNT * 3;
        const newRoot = hashAirdropLeaf(user.publicKey, updatedAmount);

        await distributor.updateRoot(newRoot, user.publicKey).signAndSend(user);

        await expectRevert(
            distributor.claim(user.publicKey, userATA, new BN(ELIGIBLE_USER_AMOUNT * 3), []).signAndSend(user),
            ErrorCode.InsufficientBalance
        );
    });
});
