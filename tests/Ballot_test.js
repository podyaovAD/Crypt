const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ballot", function () {
    let owner
    let acc1
    let acc2
    let acc3
    let acc4
    let ballot

    this.beforeEach(async function() {
        [owner, acc1, acc2, acc3, acc4, acc5] = await ethers.getSigners()
        const Ballot = await ethers.getContractFactory("Ballot", owner)
        ballot = await Ballot.deploy()
        await ballot.deployed()
    })

    it("test voting is finished error", async function() {
        await ballot.createVoting(0, 1, 0, [])
        await expect(ballot.voteFor(0)).to.be.revertedWith("Voting is finished.")
    })

    it("test wrong X", async function() {
        await ballot.createVoting(1, 1, 0, [acc1.getAddress()])
        await expect(ballot.connect(acc2).voteFor(0, { value: 2})).to.be.revertedWith("Payment amount is wrong.")
    })

    it("test voting for unexisting candidate", async function() {
        await ballot.createVoting(1, 1, 0, [])
        await expect(ballot.voteFor(0, { value: 1})).to.be.revertedWith("Candidates index out of range.")
    })

    it("test voting for the second time", async function() {
        await ballot.createVoting(1, 1, 0, [acc1.getAddress()])
        await ballot.voteFor(0, { value: 1})
        await expect(ballot.voteFor(0, { value: 1})).to.be.revertedWith("Voter has already voted.")
    })

    it("test balance after one vote", async function() {
        await ballot.createVoting(1, 1, 0, [acc1.getAddress()])
        await ballot.connect(acc2).voteFor(0, { value: 1})
        expect(await ballot.balance()).to.eq(1)
    })

    it("test one winner", async function() {
        await ballot.createVoting(1, 60, 40, [acc1.getAddress(), acc2.getAddress()])
        await ballot.connect(acc3).voteFor(0, { value: 60})
        await network.provider.send("evm_increaseTime", [86400])
        expect(await ballot.balance()).to.eq(60)
        await ballot.finishVoting()
        expect(await ballot.balance()).to.eq(40)
        await ballot.withdrawFees()
        expect(await ballot.balance()).to.eq(0)
    })

    it("test two winners", async function() {
        await ballot.createVoting(1, 60, 40, [acc1.getAddress(), acc2.getAddress()])
        await ballot.connect(acc3).voteFor(0, { value: 60})
        await ballot.connect(acc4).voteFor(1, { value: 60})
        await network.provider.send("evm_increaseTime", [86400])
        expect(await ballot.balance()).to.eq(120)
        await ballot.finishVoting()
        expect(await ballot.balance()).to.eq(80)
        await ballot.withdrawFees()
        expect(await ballot.balance()).to.eq(0)
    })

    it("test no one voted", async function() {
        await ballot.createVoting(1, 60, 40, [acc1.getAddress(), acc2.getAddress()])
        await network.provider.send("evm_increaseTime", [86400])
        expect(await ballot.balance()).to.eq(0)
        await ballot.finishVoting()
        expect(await ballot.balance()).to.eq(0)
        await ballot.withdrawFees()
        expect(await ballot.balance()).to.eq(0)
    })

    it("F is greater than X", async function() {
        await expect(ballot.createVoting(1, 60, 100, [])).to.be.revertedWith("Fee must be less than X.")
    })

    it("only owner access create contract", async function() {
        await expect(ballot.connect(acc1).createVoting(1, 60, 100, [])).to.be.revertedWith("Permission denied.")
    })

    it("only owner access withdraw fees", async function() {
        await ballot.createVoting(1, 60, 40, [acc1.getAddress(), acc2.getAddress()])
        await expect(ballot.connect(acc1).withdrawFees()).to.be.revertedWith("Permission denied.")
    })

    it("only owner access finish voting", async function() {
        await ballot.createVoting(1, 60, 40, [acc1.getAddress(), acc2.getAddress()])
        await expect(ballot.connect(acc1).finishVoting()).to.be.revertedWith("Permission denied.")
    })
})
