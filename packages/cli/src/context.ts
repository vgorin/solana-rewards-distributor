import { Connection, Keypair, PublicKey } from '@solana/web3.js';

import { AnchorProvider, setProvider, Wallet } from '@coral-xyz/anchor';
import { RewardsDistributorWrapper } from 'programs-wrappers/wrappers/RewardsDistributorWrapper';

const log = (msg: string) => console.log(`--- ${msg}`);

export enum TransactionMode {
    Normal = 'Normal',
    CalldataOnly = 'CalldataOnly',
}

export class CliContext {
    private static signer: Keypair | null = null;
    private static txSender: PublicKey | null = null;
    private static connection: Connection | null = null;
    private static transactionMode: TransactionMode | null = null;

    public static setSigner(newSigner: Keypair) {
        this.signer = newSigner;
    }

    public static getSigner() {
        if (this.signer === null) {
            throw new Error('Signer is not set');
        }
        return this.signer;
    }

    public static setTxSender(sender: string) {
        this.txSender = new PublicKey(sender);
    }

    public static getTxSender(): PublicKey {
        if (this.txSender === null) {
            throw new Error('Tx sender is not set');
        }
        return this.txSender;
    }

    public static getActualTxSender(): PublicKey {
        const txMode = this.getTransactionMode();
        if (txMode === TransactionMode.Normal) {
            return this.getSigner().publicKey;
        }
        return this.getTxSender();
    }

    public static setTransactionMode(mode: TransactionMode) {
        this.transactionMode = mode;
    }

    public static getTransactionMode() {
        if (this.transactionMode === null) {
            throw new Error('Transaction mode is not set');
        }
        return this.transactionMode;
    }

    public static setConnection(newConnection: Connection) {
        this.connection = newConnection;
    }

    public static getConnection() {
        if (this.connection === null) {
            throw new Error('connection is not set');
        }
        return this.connection;
    }

    public static getRewardsDistributorWrapperReadOnly(): RewardsDistributorWrapper {
        return this.getRewardsDistributorWrapperImpl(new Keypair());
    }

    public static getRewardsDistributorWrapper(): RewardsDistributorWrapper {
        const mode = this.getTransactionMode();
        if (mode === TransactionMode.Normal) {
            return this.getRewardsDistributorWrapperImpl(this.getSigner());
        } else {
            return this.getRewardsDistributorWrapperImpl(new Keypair());
        }
    }

    private static getRewardsDistributorWrapperImpl(signer: Keypair): RewardsDistributorWrapper {
        const connection = this.getConnection();
        const providerSignerWallet = new Wallet(signer);

        const provider = new AnchorProvider(connection, providerSignerWallet, {});
        setProvider(provider);
        return new RewardsDistributorWrapper(provider, log);
    }
}
