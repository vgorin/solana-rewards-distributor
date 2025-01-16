use anchor_lang::{prelude::*, Accounts, Key, Result};
use anchor_spl::{
    token,
    token::{Token, TokenAccount},
};

use crate::error::ErrorCode;
use crate::state::distributor_config::DistributorConfig;

#[derive(Accounts)]
pub struct Shutdown<'info> {
    #[account(
        mut,
        seeds = [DistributorConfig::SEED.as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, DistributorConfig>,

    #[account(
        mut,
        associated_token::mint = config.mint,
        associated_token::authority = config.key(),
        address = config.token_vault,
    )]
    pub from: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = config.mint,
        token::authority = config.admin,
    )]
    pub to: Account<'info, TokenAccount>,

    #[account(mut, address = config.admin @ ErrorCode::Unauthorized)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Shutdown<'info> {
    pub fn handle_shutdown(&mut self) -> Result<()> {
        self.config.shutdown = true;

        let seeds = [DistributorConfig::SEED.as_ref(), &[self.config.bump]];

        token::transfer(
            CpiContext::new(
                self.token_program.to_account_info(),
                token::Transfer {
                    from: self.from.to_account_info(),
                    to: self.to.to_account_info(),
                    authority: self.config.to_account_info(),
                },
            )
            .with_signer(&[&seeds[..]]),
            self.from.amount,
        )?;

        Ok(())
    }
}
