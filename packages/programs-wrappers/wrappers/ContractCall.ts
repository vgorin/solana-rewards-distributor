import { Signer } from '@solana/web3.js';
import { serializeInstructionToBase64 } from '@marinade.finance/spl-governance';
import { Idl, web3 } from '@coral-xyz/anchor';
import { MethodsBuilder } from '@coral-xyz/anchor/dist/cjs/program/namespace/methods';
import { IdlInstruction, IdlInstructionAccountItem } from '@coral-xyz/anchor/dist/cjs/idl';

export type TxCall = MethodsBuilder<Idl, IdlInstruction & { name: string }, IdlInstructionAccountItem>;

export class ContractCall {
    private readonly methodName: string;
    private readonly txCall: TxCall;
    private readonly log: (msg: string) => void;

    public constructor(log: (msg: string) => void, methodName: string, txCall: TxCall) {
        this.methodName = methodName;
        this.txCall = txCall;
        this.log = log;
    }

    public async serializeForGovernance(): Promise<string> {
        return serializeInstructionToBase64(await this.txCall.instruction());
    }

    public async signAndSend(signer: Signer): Promise<web3.TransactionSignature> {
        this.log(`Call '${this.methodName}' contract method`);
        const tx = await this.txCall.signers([signer]).rpc();
        this.log(`Tx hash: ${tx}`);
        return tx;
    }
}
