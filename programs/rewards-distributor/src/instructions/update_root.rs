use anchor_lang::{prelude::*, Accounts, Key, Result};

use crate::state::distributor_config::DistributorConfig;

#[derive(Accounts)]
pub struct UpdateRoot<'info> {
    #[account(
        mut,
        seeds = [DistributorConfig::SEED.as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, DistributorConfig>,

    #[account(mut, address = config.updater)]
    pub updater: Signer<'info>,
}

impl<'info> UpdateRoot<'info> {
    pub fn handle_update_root(&mut self, new_root: [u8; 32]) -> Result<()> {
        // require!(self.config.root != new_root);

        self.config.root = new_root;

        Ok(())
    }
}
