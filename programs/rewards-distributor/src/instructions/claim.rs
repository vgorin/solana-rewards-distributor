use anchor_lang::{
    prelude::*, solana_program::hash::hashv, system_program::System, Accounts, Key, Result,
};
use anchor_spl::{
    token,
    token::{Token, TokenAccount},
};

use crate::state::distributor_config::DistributorConfig;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        seeds = [DistributorConfig::SEED.as_ref()],
        bump
    )]
    pub config: Account<'info, DistributorConfig>,

    #[account(
        mut,
        associated_token::mint = config.mint,
        associated_token::authority = config.key(),
        address = config.token_vault
    )]
    pub from: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = config.mint,
        token::authority = claimant.key()
    )]
    pub to: Account<'info, TokenAccount>,

    #[account(mut)]
    pub claimant: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Claim<'info> {
    pub fn handle_claim(&self, amount: u64, proof: Vec<[u8; 32]>) -> Result<()> {
        // TODO get from storage
        let already_claimed = 0;

        require_gt!(amount, already_claimed);

        let input = hashv(&[&self.claimant.key.to_bytes(), &amount.to_be_bytes()]);
        require_eq!(self.verify_proof(input.to_bytes(), &proof), true);

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
            amount - already_claimed,
        )?;

        Ok(())
    }

    fn verify_proof(&self, input: [u8; 32], proof: &Vec<[u8; 32]>) -> bool {
        proof.iter().fold(input, |acc, sibling| {
            if acc <= *sibling {
                hashv(&[&acc, sibling]).to_bytes()
            } else {
                hashv(&[sibling, &acc]).to_bytes()
            }
        }) == self.config.root
    }
}
