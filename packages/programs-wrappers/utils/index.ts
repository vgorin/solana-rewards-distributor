import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

const U64_MAX = new BN('18446744073709551615');

export function assertFitInU64(value: BN, type: string): void {
    if (value.gt(U64_MAX)) {
        throw Error(`${type} is greater than u64::max`);
    }
}

export interface State {
    name: string;
    prefixSeed: string;
}

export function getStorageAddress(
    programId: PublicKey,
    state: State,
    additionalKeys: (number | PublicKey)[] = []
): [PublicKey, number] {
    let seeds: Buffer[] = [
        Buffer.from(state.prefixSeed, 'ascii'),
        ...additionalKeys.map((x) => {
            if (typeof x === 'number') {
                // todo: warning - may need to remove bytes len constant.
                //  Details: https://github.com/eq-lab/enjoyoors-solana-programs/pull/5#discussion_r1843514222
                const numberBuffer = Buffer.alloc(8);
                numberBuffer.writeBigUInt64BE(BigInt(x), 0);
                return numberBuffer;
            } else if (x instanceof PublicKey) {
                return x.toBuffer();
            } else {
                throw new Error(`Type '${typeof x}' is not supported as seed`);
            }
        }),
    ];
    return PublicKey.findProgramAddressSync(seeds, programId);
}
