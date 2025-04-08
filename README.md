# Solana Rewards Distributor

## Program Overview

**The Rewards Distributor** program is designed to efficiently manage and distribute airdrops on Solana using a
[Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) structure.
Each leaf in the tree represents a pair of  `(user-public-key, airdrop-amount)`.

By utilizing the Merkle tree root, this approach avoids the high costs of uploading thousands of individual entries to
the blockchain,
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

## CLI

To run localnet:

```bash
yarn localnet
```


## Admin Actions

### Initialize

```bash
yarn cli admin initialize \
  --private-key-file <filename> \
  --cluster <localnet, devnet, testnet or mainnet-beta> \
  --updater <updater_address> \
  --token-mint <token_mint_address>
```

Example:

```bash
yarn cli admin initialize \
  --private-key-file ~/.config/solana/id.json \
  --cluster 'localnet' \
  --updater '88u6FPoAKo9L4V6PzfL1Brz5JGYAdCt2QvjbgTPXZReC' \
  --token-mint '9567hvuTyD6YCm5y3g8P1xCgfg8vh12nETfcfkWWANsy'
```

### Set new admin

```bash
yarn cli admin set-admin \
  --private-key-file <filename> \
  --cluster <localnet, devnet, testnet or mainnet-beta> \
  --new-admin <admin_address>
```

### Set new updater

```bash
yarn cli admin set-updater \
  --private-key-file <filename> \
  --cluster <localnet, devnet, testnet or mainnet-beta> \
  --new-updater <updater_address>
```

### Update Merkle tree root

```bash
yarn cli admin update-root \
  --private-key-file <filename> \
  --cluster <localnet, devnet, testnet or mainnet-beta> \
  --new-root-file <filename>
```

```bash
yarn cli admin update-root \
  --private-key-file ~/.config/solana/id.json \
  --cluster localnet \
  --new-root-file 'root.json'
```

### Shutdown

```bash
yarn cli admin shutdown \
  --private-key-file <filename> \
  --cluster <localnet, devnet, testnet or mainnet-beta> \
  --token-mint <token_mint_address>
```

```bash
yarn cli admin shutdown \
  --private-key-file ~/.config/solana/id.json \
  --cluster localnet \
  --token-mint '9567hvuTyD6YCm5y3g8P1xCgfg8vh12nETfcfkWWANsy'
```

## User Actions

### Claim

```bash
yarn cli user claim \
  --private-key-file <filename> \
  --cluster <localnet, devnet, testnet or mainnet-beta> \
  --total-amount <amount> \
  --proof-file <filename>
```

## Read states

### Config

```bash
yarn cli read config \
  --private-key-file <filename> \
  --cluster <localnet, devnet, testnet or mainnet-beta>
```

### Claimed rewards

```bash
yarn cli read claimed-rewards \
  --private-key-file <filename> \
  --cluster <localnet, devnet, testnet or mainnet-beta> \
  --claimant <claimant_address>
```

## Generate Merkle Tree (Root + Proofs)

### Generate a test (address, balance) dataset

The test generated dataset can be used as a template to create a real one.

```bash
yarn cli merkle-tree generate-dataset \
  --size <dataset size, number> \
  --output-dataset-file <path to CSV data file to write dataset to>
```

Example:

```bash
yarn cli merkle-tree generate-dataset \
  --size 33 \
  --output-dataset-file example_data/dataset_example.csv
```

### Generate Merkle root and proofs

```bash
yarn cli merkle-tree generate-merkle-tree \
  --input-dataset-file <input CSV file path containing an airdrop dataset> \
  --output-merkle-root-file <output JSON file path to write Merkle root to> \
  --output-merkle-proof-folder <output folder to write Merkle proof JSON file to>
```

Example:

```bash
yarn cli merkle-tree generate-merkle-tree \
  --input-dataset-file example_data/dataset_example.csv \
  --output-merkle-root-file example_data/merkle_root-example.json \
  --output-merkle-proof-folder example_data/merkle_proofs_example
```
