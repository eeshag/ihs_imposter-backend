const { generateWord, getHints } = require('./words');

class Game {
  constructor(gameCode, hostId, hostName, numImposters = 1) {
    this.gameCode = gameCode;
    this.hostId = hostId;
    this.numImposters = numImposters;
    this.players = [];
    this.status = 'waiting'; // waiting, playing, voting, finished
    this.word = null;
    this.hints = [];
    this.currentTurnIndex = 0;
    this.descriptions = new Map(); // playerId -> description
    this.votes = new Map(); // playerId -> votedPlayerId
    this.roundNumber = 1;

    // Add host as first player
    this.addPlayer(hostId, hostName);
  }

  addPlayer(playerId, playerName) {
    if (this.status !== 'waiting') {
      throw new Error('Cannot join game that has already started');
    }
    if (this.players.length >= 12) {
      throw new Error('Game is full (maximum 12 players)');
    }
    if (this.players.find(p => p.id === playerId)) {
      throw new Error('Player already in game');
    }

    this.players.push({
      id: playerId,
      name: playerName,
      isImposter: false, // Will be assigned in startGame
      word: null,
      hint: null
    });
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      // If host leaves, assign new host
      if (this.hostId === playerId && this.players.length > 1) {
        const newHost = this.players.find(p => p.id !== playerId);
        if (newHost) {
          this.hostId = newHost.id;
        }
      }
      this.players.splice(index, 1);
      
      // Remove from descriptions and votes
      this.descriptions.delete(playerId);
      this.votes.delete(playerId);
      
      return true;
    }
    return false;
  }

  startGame() {
    if (this.status !== 'waiting') {
      throw new Error('Game has already started');
    }
    if (this.players.length < 3) {
      throw new Error('Need at least 3 players to start');
    }

    // Validate number of imposters
    const maxImposters = this.players.length - 1;
    if (this.numImposters > maxImposters) {
      throw new Error(`Cannot have more than ${maxImposters} imposters with ${this.players.length} players`);
    }
    if (this.numImposters < 1) {
      throw new Error('Must have at least 1 imposter');
    }

    // Generate word and hints
    this.word = generateWord();
    this.hints = getHints(this.word);

    // Assign roles
    const shuffledPlayers = [...this.players].sort(() => Math.random() - 0.5);
    const imposters = shuffledPlayers.slice(0, this.numImposters);
    
    this.players.forEach(player => {
      if (imposters.includes(player)) {
        player.isImposter = true;
        player.hint = this.hints[Math.floor(Math.random() * this.hints.length)];
        player.word = null;
      } else {
        player.isImposter = false;
        player.word = this.word;
        player.hint = null;
      }
    });

    // Randomly select starting player
    this.currentTurnIndex = Math.floor(Math.random() * this.players.length);
    this.status = 'playing';
  }

  submitDescription(playerId, description) {
    if (this.status !== 'playing') {
      throw new Error('Game is not in playing state');
    }

    const currentPlayer = this.players[this.currentTurnIndex];
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    if (this.descriptions.has(playerId)) {
      throw new Error('Description already submitted');
    }

    this.descriptions.set(playerId, description.trim());

    // Move to next player
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;

    // Check if we've completed a full round (all players have described)
    if (this.descriptions.size === this.players.length) {
      this.status = 'voting';
    }
  }

  allDescriptionsSubmitted() {
    return this.descriptions.size === this.players.length;
  }

  submitVote(playerId, votedPlayerId) {
    if (this.status !== 'voting') {
      throw new Error('Game is not in voting state');
    }

    if (this.votes.has(playerId)) {
      throw new Error('You have already voted');
    }

    if (!this.players.find(p => p.id === votedPlayerId)) {
      throw new Error('Invalid player to vote for');
    }

    if (playerId === votedPlayerId) {
      throw new Error('Cannot vote for yourself');
    }

    this.votes.set(playerId, votedPlayerId);
  }

  allVotesSubmitted() {
    return this.votes.size === this.players.length;
  }

  getVotingResults() {
    // Count votes
    const voteCounts = new Map();
    this.votes.forEach((votedPlayerId) => {
      voteCounts.set(votedPlayerId, (voteCounts.get(votedPlayerId) || 0) + 1);
    });

    // Find player(s) with most votes
    let maxVotes = 0;
    let votedOutPlayers = [];
    
    voteCounts.forEach((count, playerId) => {
      if (count > maxVotes) {
        maxVotes = count;
        votedOutPlayers = [playerId];
      } else if (count === maxVotes) {
        votedOutPlayers.push(playerId);
      }
    });

    // Convert to readable format
    const results = {
      voteCounts: Array.from(voteCounts.entries()).map(([playerId, count]) => ({
        playerId,
        playerName: this.players.find(p => p.id === playerId)?.name,
        votes: count
      })),
      votedOutPlayers: votedOutPlayers.map(playerId => ({
        playerId,
        playerName: this.players.find(p => p.id === playerId)?.name,
        wasImposter: this.players.find(p => p.id === playerId)?.isImposter || false
      })),
      correctWord: this.word,
      correctHints: this.hints
    };

    this.status = 'finished';
    return results;
  }

  getPublicState(playerId = null) {
    // If game is finished, show all information
    const showAllInfo = this.status === 'finished';
    
    return {
      gameCode: this.gameCode,
      hostId: this.hostId,
      players: this.players.map(player => {
        const playerInfo = {
          id: player.id,
          name: player.name
        };

        // Show role and word/hint only if:
        // - Game is finished (show all)
        // - This is the requesting player's own info
        if (showAllInfo || (playerId && player.id === playerId)) {
          playerInfo.isImposter = player.isImposter;
          playerInfo.word = player.word;
          playerInfo.hint = player.hint;
        }

        return playerInfo;
      }),
      status: this.status,
      currentTurnIndex: this.status === 'playing' ? this.currentTurnIndex : undefined,
      currentPlayer: this.status === 'playing' ? {
        id: this.players[this.currentTurnIndex].id,
        name: this.players[this.currentTurnIndex].name
      } : undefined,
      descriptions: this.status === 'voting' || this.status === 'finished' 
        ? Array.from(this.descriptions.entries()).map(([playerId, description]) => ({
            playerId,
            playerName: this.players.find(p => p.id === playerId)?.name,
            description
          }))
        : undefined,
      votes: this.status === 'finished' 
        ? Array.from(this.votes.entries()).map(([voterId, votedPlayerId]) => ({
            voterId,
            voterName: this.players.find(p => p.id === voterId)?.name,
            votedPlayerId,
            votedPlayerName: this.players.find(p => p.id === votedPlayerId)?.name
          }))
        : undefined,
      roundNumber: this.roundNumber
    };
  }
}

module.exports = Game;

