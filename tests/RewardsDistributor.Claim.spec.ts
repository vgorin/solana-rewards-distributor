import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { RewardsDistributor } from '../target/types/rewards_distributor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { expect } from 'chai';
import { expectRevert, requestSolana, initializeATA } from './shared/transactions';
import {
    CLAIMED_REWARDS_SEED,
    DISTRIBUTOR_CONFIG_SEED,
    ELIGIBLE_USER_AMOUNT,
    ELIGIBLE_USER_PK,
    ErrorCode,
    MERKLE_PROOF,
} from './shared/consts';

describe('Rewards distributor Claim', () => {
    const connection = anchor.getProvider().connection;

    const program = anchor.workspace.RewardsDistributor as Program<RewardsDistributor>;
    const config = program.account.distributorConfig;
    const claimedRewards = program.account.claimedRewards;
    const [configPda] = PublicKey.findProgramAddressSync([DISTRIBUTOR_CONFIG_SEED], program.programId);

    const user = Keypair.fromSecretKey(ELIGIBLE_USER_PK);
    const userIneligible = Keypair.generate();
    let mint: PublicKey;
    let userATA: PublicKey;

    before(async () => {
        await requestSolana(connection, 1000, user.publicKey);
        await requestSolana(connection, 1000, userIneligible.publicKey);
        const configData = await config.fetch(configPda);
        mint = configData.mint;
        userATA = await initializeATA(anchor.getProvider(), user, mint);
        await initializeATA(anchor.getProvider(), userIneligible, mint);
    });

    it('Claim', async () => {
        const vault = await getAssociatedTokenAddress(mint, configPda, true);
        const vaultBalanceBefore = (await getAccount(connection, vault)).amount;
        const userBalanceBefore = (await getAccount(connection, userATA)).amount;

        await program.methods
            .claim(new BN(ELIGIBLE_USER_AMOUNT), MERKLE_PROOF)
            .accounts({ to: userATA, claimant: user.publicKey })
            .signers([user])
            .rpc();

        const vaultBalanceAfter = (await getAccount(connection, vault)).amount;
        expect(vaultBalanceBefore - vaultBalanceAfter).to.be.eq(BigInt(ELIGIBLE_USER_AMOUNT));

        const userBalanceAfter = (await getAccount(connection, userATA)).amount;
        expect(userBalanceAfter - userBalanceBefore).to.be.eq(BigInt(ELIGIBLE_USER_AMOUNT));

        const [claimedRewardsPda] = PublicKey.findProgramAddressSync([CLAIMED_REWARDS_SEED, user.publicKey.toBuffer()], program.programId);
        const claimedRewardsData = await claimedRewards.fetch(claimedRewardsPda);
        expect(claimedRewardsData.claimed.eq(new BN(ELIGIBLE_USER_AMOUNT))).to.be.true;
    });

    it('Claim, InvalidProof', async () => {
        const tx = program.methods
            .claim(new BN(ELIGIBLE_USER_AMOUNT), MERKLE_PROOF)
            .accounts({
                to: await getAssociatedTokenAddress(mint, userIneligible.publicKey),
                claimant: userIneligible.publicKey,
            })
            .signers([userIneligible])
            .rpc();

        await expectRevert(tx, ErrorCode.InvalidProof);
    });
});
