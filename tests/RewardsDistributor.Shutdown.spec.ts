import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from '@coral-xyz/anchor';
import { RewardsDistributor } from '../target/types/rewards_distributor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { expect } from 'chai';
import { expectRevert } from './shared/transactions';
import { DISTRIBUTOR_CONFIG_SEED, ELIGIBLE_USER_AMOUNT, ELIGIBLE_USER_PK, ErrorCode } from './shared/consts';

describe('Rewards distributor Shutdown', () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.RewardsDistributor as Program<RewardsDistributor>;
    const config = program.account.distributorConfig;
    const [configPda] = PublicKey.findProgramAddressSync([DISTRIBUTOR_CONFIG_SEED], program.programId);

    const admin = Keypair.fromSecretKey(ELIGIBLE_USER_PK);
    let adminATA: PublicKey;

    before(async () => {
        const configData = await config.fetch(configPda);
        adminATA = await getAssociatedTokenAddress(configData.mint, admin.publicKey);
    });

    it('Shutdown', async () => {
        await program.methods
            .shutdown()
            .accounts({
                admin: admin.publicKey,
                to: adminATA,
            })
            .signers([admin])
            .rpc();

        const configData = await config.fetch(configPda);

        expect(configData.shutdown).to.be.true;
    });

    it('Shutdown, already set', async () => {
        const shutdownTx = program.methods
            .shutdown()
            .accounts({
                admin: admin.publicKey,
                to: adminATA,
            })
            .signers([admin])
            .rpc();

        await expectRevert(shutdownTx, ErrorCode.Shutdown);
    });

    it('Shutdown, claim fail', async () => {
        const claimTx = program.methods
            .claim(new BN(ELIGIBLE_USER_AMOUNT * 3), [])
            .accounts({ to: adminATA, claimant: admin.publicKey })
            .signers([admin])
            .rpc();

        await expectRevert(claimTx, ErrorCode.Shutdown);
    });
});
