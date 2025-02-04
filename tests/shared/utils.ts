import { Keypair, PublicKey } from '@solana/web3.js';
import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';

export function getLocalEnvSigner(): Keypair {
    const keypairPath = `${os.homedir()}/.config/solana/id.json`;
    return Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf-8'))));
}

export function hashAirdropLeaf(user: PublicKey, amount: number): Array<number> {
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigInt64BE(BigInt(amount));
    const dataBuffer = Buffer.concat([user.toBuffer(), amountBuffer]);
    return [...sha256(sha256(dataBuffer))];
}

function sha256(data: Buffer): Buffer {
    return createHash('sha256').update(data).digest();
}
