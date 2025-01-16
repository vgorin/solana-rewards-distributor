use anchor_lang::{prelude::*, Accounts, Key, Result};

use crate::state::distributor_config::DistributorConfig;

#[derive(Accounts)]
pub struct SetUpdater<'info> {
    #[account(
        mut,
        seeds = [DistributorConfig::SEED.as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, DistributorConfig>,

    #[account(mut, address = config.admin)]
    pub admin: Signer<'info>,
}

impl<'info> SetUpdater<'info> {
    pub fn handle_set_updater(&mut self, new_updater: Pubkey) -> Result<()> {
        require_keys_neq!(new_updater, self.config.updater.key());

        self.config.updater = new_updater;

        Ok(())
    }
}
