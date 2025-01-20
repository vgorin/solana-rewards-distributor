import { PublicKey } from '@solana/web3.js';
import { createHash, randomBytes } from 'crypto';

export function hashAirdropLeaf(user: PublicKey, amount: number): Array<number> {
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigInt64BE(BigInt(amount));
    const dataBuffer = Buffer.concat([user.toBuffer(), amountBuffer]);
    return [...sha256(sha256(dataBuffer))];
}

function sha256(data: Buffer): Buffer {
    return createHash('sha256').update(data).digest();
}
