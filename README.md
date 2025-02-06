# Solana Rewards Distributor

## Program Overview

**The Rewards Distributor** program is designed to efficiently manage and distribute airdrops on Solana using a 
[Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) structure.
Each leaf in the tree represents a pair of  `(user-public-key, airdrop-amount)`.

By utilizing the Merkle tree root, this approach avoids the high costs of uploading thousands of individual entries to the blockchain,
even with Solana's low transaction fees.
The program also supports authorized updates to the Merkle root while keeping track of already claimed rewards.
This allows reward amounts to be adjusted over time and calculated off-chain, offering flexibility and scalability.

Inspired by [Uniswap merkle distributor](https://github.com/Uniswap/merkle-distributor)

## Development Guide

### Requirements
1. [Anchor](https://www.anchor-lang.com/docs/installation)
2. [Yarn](https://yarnpkg.com/getting-started/install)

### Install Dependencies
To install the required dependencies, run:
```bash
yarn
```

### Build program
To build the distributor program, run:
```bash
anchor build
```

### Run tests
To execute the test suites, run:
```bash
anchor test
```

Test scenarios are located in the `tests/*.spec.ts` files

## License
This project is distributed under the GPL v3.0 license.
