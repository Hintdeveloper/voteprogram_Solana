use anchor_lang::prelude::*;

declare_id!("24efnURAN19jzNBFK14ZRBvCTMnyUu6LQSjMs1dhKbWj");

#[program]
mod vote_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;
        vote_account.candidates = Vec::new();
        msg!("Initialized vote account.");
        Ok(())
    }

    pub fn add_candidate(ctx: Context<AddCandidate>, nickname: String, wallet_address: Pubkey) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;
        vote_account.candidates.push(Candidate {
            nickname: nickname.clone(),
            wallet_address,
            votes: 0,
        });
        msg!("Added candidate with nickname {}.", nickname);
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, nickname: String) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;
        let candidate = vote_account.candidates.iter_mut().find(|c| c.nickname == nickname)
            .ok_or(ProgramError::InvalidArgument)?;
        candidate.votes += 1;
        msg!("Voted for candidate {}!", nickname);
        Ok(())
    }

    pub fn view_vote(ctx: Context<ViewVote>, nickname: String) -> Result<u64> {
        let vote_account = &ctx.accounts.vote_account;
        let candidate = vote_account.candidates.iter().find(|c| c.nickname == nickname)
            .ok_or(ProgramError::InvalidArgument)?;
        let votes = candidate.votes;
        msg!("Candidate {} has {} votes.", nickname, votes);
        Ok(votes)
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = 8 + 1000)] // Estimate space needed
    pub vote_account: Account<'info, VoteAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddCandidate<'info> {
    #[account(mut)]
    pub vote_account: Account<'info, VoteAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub vote_account: Account<'info, VoteAccount>,
    #[account(mut)]
    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct ViewVote<'info> {
    pub vote_account: Account<'info, VoteAccount>,
}

#[account]
pub struct VoteAccount {
    candidates: Vec<Candidate>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Candidate {
    nickname: String,
    wallet_address: Pubkey,
    votes: u64,
}
