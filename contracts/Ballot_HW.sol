// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;


contract Ballot{
    address public contract_owner ;

    struct Voter{
        bool voted; //vote flag
        uint vote; //index of candidate

    }

    mapping(address => Voter) public voters;     

    struct Candidate{
        address payable account;
        uint voteCount;
    }

    Candidate[] public candidates;

    struct Vote{
        uint daysLeft;
        uint Cost;
        uint fee;
        Candidate[] candidates;
    }

    uint public cost;
    uint public fee;
    uint public finishDate;
    mapping(address => uint) FeesPayment;


    error TooEarly(uint time);
    error TooLate(uint time);

    modifier if_owner(){
        if (msg.sender == contract_owner) {
            _;
        }
    }


    constructor() {
        contract_owner = msg.sender;
    }

    function createVoting(uint D, uint X, uint F, address[] memory candidates1) if_owner public {
        require(D>0,"No days - no vote");
        require(candidates.length>0, "There are no candidates");
        finishDate = block.timestamp + (D * 1 days);
        cost = X;
        fee = F;
        for (uint i = 0; i < candidates1.length; i++) {
            candidates.push(
                Candidate({
                    account: payable(candidates1[i]), 
                    voteCount: 0
                })
            );
        }
    }

    function withdrawFees()  if_owner public {
        require(block.timestamp >= finishDate, "Voting is not finished.");

        uint MaxVotesCount = 0;
        uint AllVotes = 0;
        uint NumWinners = 0;

        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > MaxVotesCount) {
                MaxVotesCount = candidates[i].voteCount;
                NumWinners = 1;
            } 
            if (candidates[i].voteCount == MaxVotesCount) {
                NumWinners += 1;
            }
            AllVotes += candidates[i].voteCount;
        }

        uint AwardsForAll = (cost * AllVotes - fee * AllVotes )/ NumWinners;
        assert(AwardsForAll >= 0);

        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount == MaxVotesCount) {
                candidates[i].account.transfer(AwardsForAll);
            }
        }

        payable(contract_owner).transfer(fee * AllVotes);
    }

    

    function voteFor(uint CandidateId) public payable {
        require(block.timestamp >= finishDate, "Voting is finished.");
        require(!voters[msg.sender].voted, "Voter has already voted.");
        require(msg.value == cost, "Payment amount is wrong.");

        voters[msg.sender].voted = true;
        voters[msg.sender].vote = CandidateId;

        candidates[CandidateId].voteCount += 1;
    }

    function getVoteInfo() public view returns(uint D, uint X, uint F ) { 
        D =  (finishDate - block.timestamp) / 60 / 60 / 24;
        X = cost;
        F = fee;
    }
}