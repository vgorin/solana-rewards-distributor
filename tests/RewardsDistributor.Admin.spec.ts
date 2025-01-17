import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { RewardsDistributor } from '../target/types/rewards_distributor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { expect } from 'chai';
import { expectRevert, createTokenMint, requestSolana } from './shared/transactions';
import { DISTRIBUTOR_CONFIG_SEED, ErrorCode } from './shared/consts';

describe('Rewards distributor Admin', () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    const connection = anchor.getProvider().connection;

    const program = anchor.workspace.RewardsDistributor as Program<RewardsDistributor>;

    const config = program.account.distributorConfig;
    const [configPda] = PublicKey.findProgramAddressSync([DISTRIBUTOR_CONFIG_SEED], program.programId);

    let admin = Keypair.generate();
    const updater = Keypair.generate();
    const unauthorized = Keypair.generate();
    let mint: PublicKey;

    before(async () => {
        await requestSolana(connection, 1000, admin.publicKey);
        await requestSolana(connection, 1000, updater.publicKey);
        await requestSolana(connection, 1000, unauthorized.publicKey);
        mint = await createTokenMint(connection, admin);
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

    it('Update root', async () => {
        const newRoot = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
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

    it('Set updater', async () => {
        const newUpdater = Keypair.generate();
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

    it('Set admin', async () => {
        const newAdmin = Keypair.generate();
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
