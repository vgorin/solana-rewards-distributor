use anchor_lang::{
    account, context::Context, prelude::*, solana_program::hash::HASH_BYTES, Accounts, Key,
    ToAccountInfo,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::state::distributor_config::DistributorConfig;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [DistributorConfig::SEED.as_ref()],
        bump,
        space = DistributorConfig::LEN,
        payer = admin,
    )]
    pub config: Account<'info, DistributorConfig>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        associated_token::mint = mint,
        associated_token::authority = config,
        payer = admin,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize(ctx: Context<Initialize>, updater: Pubkey) -> Result<()> {
    let accounts = ctx.accounts;
    accounts.config.bump = ctx.bumps.config;
    accounts.config.root = [0; HASH_BYTES];
    accounts.config.mint = accounts.mint.key();
    accounts.config.token_vault = accounts.token_vault.key();
    accounts.config.admin = accounts.admin.key();
    accounts.config.updater = updater;
    accounts.config.shutdown = false;

    Ok(())
}
