// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IInstantDistributionAgreementV1.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MissaoFluxo is Ownable {
    ISuperfluid private _host; // Superfluid host contract
    IConstantFlowAgreementV1 private _cfa; // Constant Flow Agreement contract
    IInstantDistributionAgreementV1 private _ida; // Instant Distribution Agreement contract
    ISuperToken private _superToken; // Super Token used in the game

    struct Player {
        uint256 level;
        uint256 exp;
        uint256 hp;
        uint256 maxHp;
        string[] skills;
        uint256 lastCheckIn;
    }

    struct Guild {
        address[] members;
        uint32 indexId;
    }

    mapping(address => Player) public players;
    mapping(address => Guild) public guilds;

    event PlayerRegistered(address player);
    event LevelUp(address player, uint256 newLevel);
    event SkillLearned(address player, string skill);
    event GuildCreated(address guildMaster);
    event GuildJoined(address player, address guild);

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        IInstantDistributionAgreementV1 ida,
        ISuperToken superToken
    ) {
        _host = host;
        _cfa = cfa;
        _ida = ida;
        _superToken = superToken;
    }

    function registerPlayer() external {
        require(players[msg.sender].level == 0, "Player already registered");
        
        players[msg.sender] = Player({
            level: 1,
            exp: 0,
            hp: 100,
            maxHp: 100,
            skills: new string[](0),
            lastCheckIn: block.timestamp
        });

        // Start initial token flow to the player
        _createFlow(msg.sender, 1000000000000000); // approx. 2.592 tokens per month

        emit PlayerRegistered(msg.sender);
    }

    function checkIn() external {
        Player storage player = players[msg.sender];
        require(player.level > 0, "Player not registered");

        uint256 timePassed = block.timestamp - player.lastCheckIn;
        uint256 flowRate = _getFlowRate(msg.sender);
        uint256 tokensEarned = timePassed * flowRate;

        // Update player HP based on tokens earned
        player.hp = min(player.maxHp, player.hp + tokensEarned / 1e18);
        player.lastCheckIn = block.timestamp;

        // Gain some EXP for checking in
        _gainExperience(msg.sender, 10);
    }

    function train(string memory skill) external {
        Player storage player = players[msg.sender];
        require(player.level > 0, "Player not registered");

        // Increase flow rate temporarily for training
        _updateFlow(msg.sender, _getFlowRate(msg.sender) * 2);

        // Learn the skill
        player.skills.push(skill);

        // Gain experience
        _gainExperience(msg.sender, 50);

        // Reset flow rate after 1 hour (simplified, in reality this would be a separate transaction)
        _updateFlow(msg.sender, _getFlowRate(msg.sender) / 2);

        emit SkillLearned(msg.sender, skill);
    }

    function createGuild() external {
        require(players[msg.sender].level >= 10, "Must be at least level 10 to create a guild");
        require(guilds[msg.sender].members.length == 0, "Already in a guild");

        uint32 indexId = _ida.createIndex(_superToken, address(this), getNextIndexId());
        guilds[msg.sender] = Guild({
            members: new address[](1),
            indexId: indexId
        });
        guilds[msg.sender].members[0] = msg.sender;

        emit GuildCreated(msg.sender);
    }

    function joinGuild(address guildMaster) external {
        require(players[msg.sender].level > 0, "Player not registered");
        require(guilds[guildMaster].members.length > 0, "Guild does not exist");
        require(guilds[msg.sender].members.length == 0, "Already in a guild");

        Guild storage guild = guilds[guildMaster];
        guild.members.push(msg.sender);

        // Update IDA units for the new member
        _ida.updateSubscription(_superToken, address(this), guild.indexId, msg.sender, 1);

        emit GuildJoined(msg.sender, guildMaster);
    }

    function distributeToGuild(address guildMaster, uint256 amount) external {
        require(guilds[guildMaster].members.length > 0, "Guild does not exist");

        uint256 actualAmount = _superToken.balanceOf(msg.sender) >= amount ? amount : _superToken.balanceOf(msg.sender);
        _superToken.transferFrom(msg.sender, address(this), actualAmount);

        Guild storage guild = guilds[guildMaster];
        _ida.distribute(_superToken, guild.indexId, actualAmount);
    }

    function _createFlow(address to, int96 flowRate) internal {
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.createFlow.selector,
                _superToken,
                to,
                flowRate,
                new bytes(0)
            ),
            "0x"
        );
    }

    function _updateFlow(address to, int96 flowRate) internal {
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _superToken,
                to,
                flowRate,
                new bytes(0)
            ),
            "0x"
        );
    }

    function _getFlowRate(address player) internal view returns (int96) {
        (,int96 flowRate,,) = _cfa.getFlow(_superToken, address(this), player);
        return flowRate;
    }

    function _gainExperience(address player, uint256 amount) internal {
        Player storage p = players[player];
        p.exp += amount;
        if (p.exp >= p.level * 100) {
            p.level++;
            p.maxHp += 20;
            p.hp = p.maxHp;
            emit LevelUp(player, p.level);
        }
    }

    function getNextIndexId() internal view returns (uint32) {
        // Implementation to get the next available index ID
        // This is a placeholder and should be properly implemented
        return 0;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}