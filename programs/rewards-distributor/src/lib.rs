use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::HASH_BYTES;
use solana_security_txt::security_txt;

use instructions::*;

mod error;
mod instructions;
mod state;

security_txt! {
    name: "Solana Rewards Distributor",
    project_url: "https://enjoyoors.xyz/",
    contacts: "support@enjoyoors.xyz",
    policy: "https://github.com/eq-lab/solana-rewards-distributor",
    preferred_languages: "en",
    source_code: "https://github.com/eq-lab/solana-rewards-distributor"
}

declare_id!("3UzMu6EhgnZMg95WpyDLA6JJPho2YEW7QF3sNcv4Zi8K");

#[program]
pub mod rewards_distributor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, updater: Pubkey) -> Result<()> {
        handle_initialize(ctx, updater)
    }

    pub fn claim(
        ctx: Context<Claim>,
        total_amount: u64,
        proof: Vec<[u8; HASH_BYTES]>,
    ) -> Result<()> {
        ctx.accounts.handle_claim(total_amount, proof)
    }

    pub fn update_root(ctx: Context<UpdateRoot>, new_root: [u8; HASH_BYTES]) -> Result<()> {
        ctx.accounts.handle_update_root(new_root)
    }

    pub fn set_admin(ctx: Context<SetAdmin>, new_admin: Pubkey) -> Result<()> {
        ctx.accounts.handle_set_admin(new_admin)
    }

    pub fn set_updater(ctx: Context<SetUpdater>, new_updater: Pubkey) -> Result<()> {
        ctx.accounts.handle_set_updater(new_updater)
    }

    pub fn shutdown(ctx: Context<Shutdown>) -> Result<()> {
        ctx.accounts.handle_shutdown()
    }
}
