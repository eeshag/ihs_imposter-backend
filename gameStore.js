// In-memory game store that matches the frontend's expected structure
const GAME_STATE = {
	WAITING_FOR_START: 'WAITING_FOR_START',
	ROLE_REVEAL: 'ROLE_REVEAL',
	ALL_READY: 'ALL_READY',
	START_PLAYER_SELECTED: 'START_PLAYER_SELECTED',
	GAME_IN_PROGRESS: 'GAME_IN_PROGRESS',
	VOTING: 'VOTING',
	VOTING_RESULTS: 'VOTING_RESULTS',
	ENDED: 'ENDED',
};

const PLAYER_ROLE = {
	IMPOSTER: 'IMPOSTER',
	PLAYER: 'PLAYER',
};

const WORD_HINT_PAIRS = [
	{ word: 'math club', hint: 'nailong' },
	{ word: 'ihs pjs', hint: 'comfy' },
	{ word: 'track and field', hint: 'spring' },
	{ word: 'hello rally', hint: 'hi!' },
	{ word: 'double accel', hint: 'hard' },
	{ word: 'ihs quarter zip', hint: 'performative' },
	{ word: 'blue crew', hint: 'friday' },
];

class GameStore {
	constructor() {
		this.games = new Map(); // code -> game object
	}

	generateGameCode() {
		const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let attempt = 0;
		while (attempt < 10000) {
			let code = '';
			for (let i = 0; i < 6; i += 1) {
				code += alphabet[Math.floor(Math.random() * alphabet.length)];
			}
			if (!this.games.has(code)) {
				return code;
			}
			attempt += 1;
		}
		return String(Date.now()).slice(-6);
	}

	createGame(totalPlayers, numImposters) {
		const code = this.generateGameCode();
		const game = {
			code,
			totalPlayers,
			numImposters,
			joinedCount: 1,
			createdAt: Date.now(),
			state: GAME_STATE.WAITING_FOR_START,
			players: { 1: { role: null, ready: false } },
			word: null,
			hint: null,
			startingPlayer: null,
			selectedPlayers: [],
			votes: {},
			voteCount: 0,
			impostersRevealed: false,
		};
		this.games.set(code, game);
		return game;
	}

	getGame(code) {
		return this.games.get(code) || null;
	}

	tryJoinGame(code) {
		const game = this.games.get(code);
		if (!game) {
			return { ok: false, reason: 'invalid' };
		}
		if (game.joinedCount >= game.totalPlayers) {
			return { ok: false, reason: 'full' };
		}
		
		const assignedPlayerNumber = game.joinedCount + 1;
		game.joinedCount += 1;
		if (!game.players) {
			game.players = {};
		}
		if (!game.players[assignedPlayerNumber]) {
			game.players[assignedPlayerNumber] = { role: null, ready: false };
		}
		
		return { ok: true, game, playerNumber: assignedPlayerNumber };
	}

	selectWordAndHint() {
		const randomIndex = Math.floor(Math.random() * WORD_HINT_PAIRS.length);
		return WORD_HINT_PAIRS[randomIndex];
	}

	assignRoles(totalPlayers, numImposters) {
		const roles = {};
		const playerNumbers = Array.from({ length: totalPlayers }, (_, i) => i + 1);
		const shuffled = [...playerNumbers].sort(() => Math.random() - 0.5);
		const imposterNumbers = shuffled.slice(0, numImposters);
		
		for (let i = 1; i <= totalPlayers; i++) {
			roles[i] = {
				role: imposterNumbers.includes(i) ? PLAYER_ROLE.IMPOSTER : PLAYER_ROLE.PLAYER,
				ready: false,
			};
		}
		return roles;
	}

	startGame(code) {
		const game = this.games.get(code);
		if (!game) return null;
		if (game.state !== GAME_STATE.WAITING_FOR_START) return game;
		if (game.joinedCount < game.totalPlayers) return game;
		
		const { word, hint } = this.selectWordAndHint();
		const roles = this.assignRoles(game.totalPlayers, game.numImposters);
		
		game.state = GAME_STATE.ROLE_REVEAL;
		game.word = word;
		game.hint = hint;
		game.players = roles;
		
		return game;
	}

	markPlayerReady(code, playerNumber) {
		const game = this.games.get(code);
		if (!game || !game.players || !game.players[playerNumber]) {
			return null;
		}
		
		game.players[playerNumber].ready = true;
		
		const allReady = Object.values(game.players).every(p => p.ready);
		if (allReady && game.state === GAME_STATE.ROLE_REVEAL) {
			game.state = GAME_STATE.ALL_READY;
		}
		
		return game;
	}

	selectStartingPlayer(code) {
		const game = this.games.get(code);
		if (!game || game.state !== GAME_STATE.ALL_READY) {
			return game;
		}
		
		const startingPlayer = Math.floor(Math.random() * game.totalPlayers) + 1;
		game.state = GAME_STATE.START_PLAYER_SELECTED;
		game.startingPlayer = startingPlayer;
		game.selectedPlayers = [startingPlayer];
		
		return game;
	}

	selectNextPlayer(code) {
		const game = this.games.get(code);
		if (!game || game.state !== GAME_STATE.START_PLAYER_SELECTED) {
			return game;
		}
		
		const selectedPlayers = game.selectedPlayers || [];
		const allPlayers = Array.from({ length: game.totalPlayers }, (_, i) => i + 1);
		const remainingPlayers = allPlayers.filter(p => !selectedPlayers.includes(p));
		
		if (remainingPlayers.length === 0) {
			return game;
		}
		
		const nextPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
		game.startingPlayer = nextPlayer;
		game.selectedPlayers = [...selectedPlayers, nextPlayer];
		
		return game;
	}

	endGame(code) {
		const game = this.games.get(code);
		if (!game) return null;
		
		game.state = GAME_STATE.ENDED;
		return game;
	}

	startVoting(code) {
		const game = this.games.get(code);
		if (!game) return null;
		
		if (game.state !== GAME_STATE.VOTING && game.state !== GAME_STATE.VOTING_RESULTS) {
			game.state = GAME_STATE.VOTING;
			if (!game.votes) {
				game.votes = {};
			}
			if (!game.voteCount) {
				game.voteCount = 0;
			}
			if (!game.impostersRevealed) {
				game.impostersRevealed = false;
			}
		}
		return game;
	}
}

module.exports = { GameStore, GAME_STATE, PLAYER_ROLE };
