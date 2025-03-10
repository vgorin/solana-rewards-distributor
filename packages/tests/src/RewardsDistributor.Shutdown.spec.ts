import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { expect } from 'chai';
import { expectRevert } from './shared/transactions';
import { ELIGIBLE_USER_AMOUNT, ELIGIBLE_USER_PK, ErrorCode } from './shared/consts';
import { RewardsDistributorWrapper } from 'programs-wrappers/wrappers/RewardsDistributorWrapper';

describe('Rewards distributor Shutdown', () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const distributor = new RewardsDistributorWrapper(anchor.getProvider());

    const admin = Keypair.fromSecretKey(ELIGIBLE_USER_PK);
    let adminATA: PublicKey;

    before(async () => {
        const configData = await distributor.getDistributorConfig();
        adminATA = await getAssociatedTokenAddress(configData.mint, admin.publicKey);
    });

    it('Shutdown', async () => {
        await distributor.shutdown(admin.publicKey, adminATA).signAndSend(admin);

        const configData = await distributor.getDistributorConfig();

        expect(configData.shutdown).to.be.true;
    });

    it('Shutdown, already set', async () => {
        await expectRevert(distributor.shutdown(admin.publicKey, adminATA).signAndSend(admin), ErrorCode.Shutdown);
    });

    it('Shutdown, claim fail', async () => {
        await expectRevert(
            distributor.claim(admin.publicKey, adminATA, new BN(ELIGIBLE_USER_AMOUNT * 3), []).signAndSend(admin),
            ErrorCode.Shutdown
        );
    });
});
