export enum ErrorCode {
    AlreadyClaimed = 'AlreadyClaimed',
    InsufficientBalance = 'InsufficientBalance',
    InvalidProof = 'InvalidProof',
    Unauthorized = 'Unauthorized',
    SameValue = 'SameValue',
    Shutdown = 'Shutdown',
}

export const DISTRIBUTOR_CONFIG_SEED: Buffer = Buffer.from('DistributorConfig');
export const CLAIMED_REWARDS_SEED: Buffer = Buffer.from('ClaimedRewards');

export const DEFAULT_TOKEN_DECIMALS: number = 6;

// precalculated merkle root for tests
export const MERKLE_ROOT = Buffer.from('c0a879150e723527fea71b5b0b7ffd6ac61702066b91a8882b5d29581d937eb7', 'hex');

// corresponding public key is used in `MERKLE_ROOT` generation
export const ELIGIBLE_USER_PK = Buffer.from([
    36, 53, 134, 213, 157, 174, 255, 148, 233, 193, 192, 57, 214, 33, 141, 106, 139, 235, 61, 246, 35, 246, 98, 203,
    168, 197, 253, 157, 113, 225, 63, 82, 192, 216, 235, 12, 179, 64, 244, 46, 91, 199, 37, 240, 234, 167, 229, 5, 6,
    175, 196, 124, 170, 195, 129, 149, 200, 72, 180, 117, 201, 64, 29, 182,
]);

// the amount of test token that can be claimed by `ELIGIBLE_USER`
export const ELIGIBLE_USER_AMOUNT = 1_234_567_890;

// merkle proof for (`ELIGIBLE_USER`, `ELIGIBLE_USER_AMOUNT`) data
export const MERKLE_PROOF = [
    [...Buffer.from('5d5ac08387c6c61821fcb3baec63a06294acde9f934dca2ff90020d87141738e', 'hex')],
    [...Buffer.from('6a4023b88909ceb032e0b12d6767827e999828fff97db50bd6f7f78da957aea9', 'hex')],
    [...Buffer.from('bdc37272b993e8179b0e119e536fdd2b80eae9b35d132e8b4e7cf1476f70bc10', 'hex')],
    [...Buffer.from('7d23de928816d048c087708be5dbeb7e2e2c4a8d5c05359fd0f3bd05b930e2b6', 'hex')],
    [...Buffer.from('850332ecea6a0d40bcfe0ac1d53979794777791cce708fe5e2edce71c70e3c54', 'hex')],
    [...Buffer.from('fe0615b5e3c96a65d3e9bd81e6aeec8ec67d0287162bb072d0288888d122e36e', 'hex')],
    [...Buffer.from('b8276bf2167f5661fe837d3e23c5c522519e8fc6694c48123c1507791257b916', 'hex')],
    [...Buffer.from('425fe77edcf2816bd3e98f37c98a558201c66d8b661a26ce731d34c6289e52f8', 'hex')],
    [...Buffer.from('9716d96af0bc09e643d1871cd4a1078162ffde424e46ec6de241a68a7c8b692c', 'hex')],
];
