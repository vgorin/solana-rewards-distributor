use anchor_lang::{
    account,
    prelude::{Pubkey, *},
};

#[account]
#[derive(Default, Debug)]
pub struct DistributorConfig {
    pub bump: u8,
    pub root: [u8; 32],
    pub mint: Pubkey,
    pub token_vault: Pubkey,
    pub admin: Pubkey,
    pub updater: Pubkey,
    pub shutdown: bool,
}

impl DistributorConfig {
    pub const LEN: usize = 8 + std::mem::size_of::<DistributorConfig>();
    pub const SEED: &[u8; 17] = b"DistributorConfig";
}
