import * as anchor from "@coral-xyz/anchor";
import assert from "assert";
import * as web3 from "@solana/web3.js";
import type { VoteProgram } from "../target/types/vote_program";
describe("Vote Program Test", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.VoteProgram as anchor.Program<VoteProgram>;
  
  let voteAccountKp;

  it("initialize", async () => {
    // Generate keypair for the new vote account
    voteAccountKp = new web3.Keypair();

    // Send transaction to initialize the vote account
    const txHash = await program.methods
      .initialize()
      .accounts({
        voteAccount: voteAccountKp.publicKey,
        signer: program.provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([voteAccountKp])
      .rpc();
    console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

    // Confirm transaction
    await program.provider.connection.confirmTransaction(txHash);

    // Fetch the created vote account
    const voteAccount = await program.account.voteAccount.fetch(
      voteAccountKp.publicKey
    );

    console.log("Initialized vote account with candidates:", voteAccount.candidates);
    assert(voteAccount.candidates.length === 0);
  });

  it("add candidate", async () => {
    const nickname = "Alice";
    const walletAddress = new web3.Keypair().publicKey;

    // Send transaction to add a candidate
    const txHash = await program.methods
      .addCandidate(nickname, walletAddress)
      .accounts({
        voteAccount: voteAccountKp.publicKey,
        signer: program.provider.publicKey,
      })
      .signers([])
      .rpc();
    console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

    // Confirm transaction
    await program.provider.connection.confirmTransaction(txHash);

    // Fetch the updated vote account
    const voteAccount = await program.account.voteAccount.fetch(
      voteAccountKp.publicKey
    );

    console.log("Updated vote account with candidates:", voteAccount.candidates);
    assert(voteAccount.candidates.length === 1);
    assert(voteAccount.candidates[0].nickname === nickname);
    assert(voteAccount.candidates[0].walletAddress.toString() === walletAddress.toString());
  });

  it("vote for candidate", async () => {
    const candidateNickname = "Alice";

    // Send transaction to vote for a candidate
    const txHash = await program.methods
      .vote(candidateNickname)
      .accounts({
        voteAccount: voteAccountKp.publicKey,
        voter: program.provider.publicKey,
      })
      .signers([])
      .rpc();
    console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

    // Confirm transaction
    await program.provider.connection.confirmTransaction(txHash);

    // Fetch the updated vote account
    const voteAccount = await program.account.voteAccount.fetch(
      voteAccountKp.publicKey
    );

    console.log("Vote counts after voting:", voteAccount.candidates);
    const candidate = voteAccount.candidates.find(c => c.nickname === candidateNickname);
    assert(candidate.votes.toNumber() === 1); // Convert BigNumber to number
  });

  it("view vote count", async () => {
    const candidateNickname = "Alice";

    // Fetch the vote account
    const voteAccount = await program.account.voteAccount.fetch(
      voteAccountKp.publicKey
    );

    // Get the vote count for the candidate
    const candidate = voteAccount.candidates.find(c => c.nickname === candidateNickname);
    const votes = candidate.votes;
    console.log(`Candidate ${candidateNickname} has ${votes} votes.`);

    // Check whether the vote count is as expected
    assert(votes.toNumber() === 1);
  });
});
