const Game = require('./game');

class GameManager {
  constructor() {
    this.games = new Map(); // gameCode -> Game instance
  }

  createGame(hostId, hostName, numImposters = 1) {
    const gameCode = this.generateGameCode();
    const game = new Game(gameCode, hostId, hostName, numImposters);
    this.games.set(gameCode, game);
    return gameCode;
  }

  joinGame(gameCode, playerId, playerName) {
    const game = this.games.get(gameCode);
    if (!game) {
      throw new Error('Game not found');
    }
    game.addPlayer(playerId, playerName);
    return game;
  }

  getGame(gameCode) {
    const game = this.games.get(gameCode);
    if (!game) {
      throw new Error('Game not found');
    }
    return game;
  }

  removePlayer(playerId) {
    for (const [gameCode, game] of this.games.entries()) {
      if (game.removePlayer(playerId)) {
        // If no players left, remove the game
        if (game.players.length === 0) {
          this.games.delete(gameCode);
        }
        return gameCode;
      }
    }
    return null;
  }

  generateGameCode() {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.games.has(code)); // Ensure unique code
    return code;
  }
}

module.exports = GameManager;


