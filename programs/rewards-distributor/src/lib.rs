use anchor_lang::prelude::*;

declare_id!("3UzMu6EhgnZMg95WpyDLA6JJPho2YEW7QF3sNcv4Zi8K");


#[program]
pub mod rewards_distributor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
