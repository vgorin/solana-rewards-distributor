import { BN, Program, Provider } from '@coral-xyz/anchor';
import { RewardsDistributor } from '../../../target/types/rewards_distributor';
// @ts-ignore
import RewardsDistributorIDL from '../../../target/idl/rewards_distributor.json';
import { PublicKey } from '@solana/web3.js';

import { ContractCall, TxCall } from './ContractCall';
import { assertFitInU64, getStorageAddress, State } from '../utils';

export interface RewardsDistributorConfig {
    bump: number;
    root: number[];
    mint: PublicKey;
    tokenVault: PublicKey;
    admin: PublicKey;
    updater: PublicKey;
    shutdown: boolean;
}

export interface ClaimedRewards {
    bump: number;
    claimed: BN;
}

class Storage {
    public static ClaimedRewards: State = { name: 'claimedRewards', prefixSeed: 'ClaimedRewards' };
    public static DistributorConfig: State = { name: 'distributorConfig', prefixSeed: 'DistributorConfig' };
}

export class RewardsDistributorWrapper {
    public readonly program: Program<RewardsDistributor>;
    private readonly log: (msg: string) => void;

    public constructor(provider: Provider, log: (msg: string) => void = (_: string) => {}) {
        // @ts-ignore
        this.program = new Program(RewardsDistributorIDL, provider);
        this.log = log;
    }

    public getProgramId(): PublicKey {
        return this.program.programId;
    }

    public async initialize(admin: PublicKey, updater: PublicKey, mint: PublicKey): Promise<ContractCall> {
        const programAccountInfo = await this.program.provider.connection.getAccountInfo(this.program.programId);
        if (programAccountInfo == null) {
            throw new Error('Failed to obtain Vault program account info');
        }

        const programData = new PublicKey(programAccountInfo.data.subarray(4, 36));

        return this.createContractCall(
            'initialize',
            this.program.methods.initialize(updater).accounts({
                mint,
                admin,
                programData: programData,
            })
        );
    }

    public claim(claimant: PublicKey, toATA: PublicKey, totalAmount: bigint | BN, proof: number[][]): ContractCall {
        const totalAmountBn = new BN(totalAmount.toString());
        assertFitInU64(totalAmountBn, 'total amount');

        return this.createContractCall(
            'claim',
            this.program.methods.claim(totalAmountBn, proof).accounts({ to: toATA, claimant })
        );
    }

    public setAdmin(newAdmin: PublicKey, admin: PublicKey): ContractCall {
        return this.createContractCall('setAdmin', this.program.methods.setAdmin(newAdmin).accounts({ admin }));
    }

    public setUpdater(newUpdater: PublicKey, admin: PublicKey): ContractCall {
        return this.createContractCall('setUpdater', this.program.methods.setUpdater(newUpdater).accounts({ admin }));
    }

    public shutdown(admin: PublicKey, adminATA: PublicKey): ContractCall {
        return this.createContractCall('shutdown', this.program.methods.shutdown().accounts({ admin, to: adminATA }));
    }

    public updateRoot(newRoot: number[], updater: PublicKey): ContractCall {
        return this.createContractCall('updateRoot', this.program.methods.updateRoot(newRoot).accounts({ updater }));
    }

    public getClaimedRewardsAddress(claimant: PublicKey): PublicKey {
        return getStorageAddress(this.program.programId, Storage.ClaimedRewards, [claimant])[0];
    }

    public getDistributorConfigAddress(): PublicKey {
        return getStorageAddress(this.program.programId, Storage.DistributorConfig)[0];
    }

    public async getClaimedRewards(claimant: PublicKey): Promise<ClaimedRewards> {
        return this.program.account.claimedRewards.fetch(this.getClaimedRewardsAddress(claimant));
    }

    public async getDistributorConfig(): Promise<RewardsDistributorConfig> {
        return this.program.account.distributorConfig.fetch(this.getDistributorConfigAddress());
    }

    public async isInitialized(): Promise<boolean> {
        try {
            await this.getDistributorConfig();
        } catch (err) {
            if (
                (err as Error).message ===
                `Account does not exist or has no data ${this.getDistributorConfigAddress().toBase58()}`
            ) {
                return false;
            }
            throw err;
        }

        return true;
    }

    private createContractCall(methodName: string, txCall: TxCall): ContractCall {
        return new ContractCall(this.log, methodName, txCall);
    }
}
