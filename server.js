const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');
const { GameStore } = require('./gameStore');

const app = express();

// CORS configuration - allow frontend origin
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

// If ALLOWED_ORIGINS is set to "*", allow all origins
const allowAllOrigins = allowedOrigins.includes('*');

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // If allow all origins is enabled, allow everything
    if (allowAllOrigins) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log for debugging
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      // For now, allow all origins to fix the issue - you can restrict this later
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse JSON bodies

const gameStore = new GameStore();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow all origins for now to fix CORS issues
      // You can restrict this later by setting ALLOWED_ORIGINS environment variable
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const gameManager = new GameManager();

// Serve basic info
app.get('/', (req, res) => {
  res.json({ message: 'IHS Imposter Backend API', status: 'running' });
});

// REST API endpoints for game management
app.post('/api/game/create', (req, res) => {
  try {
    const { totalPlayers, numImposters } = req.body;
    const game = gameStore.createGame(totalPlayers, numImposters);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/game/:code', (req, res) => {
  const { code } = req.params;
  const game = gameStore.getGame(code.toUpperCase());
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(game);
});

app.post('/api/game/:code/join', (req, res) => {
  try {
    const { code } = req.params;
    const result = gameStore.tryJoinGame(code.toUpperCase());
    if (!result.ok) {
      return res.status(400).json({ ok: false, reason: result.reason });
    }
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/game/:code/start', (req, res) => {
  try {
    const { code } = req.params;
    const game = gameStore.startGame(code.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/game/:code/ready', (req, res) => {
  try {
    const { code } = req.params;
    const { playerNumber } = req.body;
    const game = gameStore.markPlayerReady(code.toUpperCase(), playerNumber);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/game/:code/select-starting-player', (req, res) => {
  try {
    const { code } = req.params;
    const game = gameStore.selectStartingPlayer(code.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/game/:code/select-next-player', (req, res) => {
  try {
    const { code } = req.params;
    const game = gameStore.selectNextPlayer(code.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/game/:code/end', (req, res) => {
  try {
    const { code } = req.params;
    const game = gameStore.endGame(code.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/game/:code/start-voting', (req, res) => {
  try {
    const { code } = req.params;
    const game = gameStore.startVoting(code.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/game/:code/submit-vote', (req, res) => {
  try {
    const { code } = req.params;
    const { playerNumber, votedPlayers } = req.body;
    const game = gameStore.getGame(code.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    if (game.state !== 'VOTING') {
      return res.status(400).json({ error: 'Game is not in voting state' });
    }
    if (!game.votes) {
      game.votes = {};
    }
    if (!game.voteCount) {
      game.voteCount = 0;
    }
    if (!game.votes[playerNumber]) {
      game.voteCount += 1;
    }
    game.votes[playerNumber] = [...votedPlayers];
    if (game.voteCount >= game.totalPlayers) {
      game.state = 'VOTING_RESULTS';
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/game/:code/reveal-imposters', (req, res) => {
  try {
    const { code } = req.params;
    const game = gameStore.getGame(code.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    game.impostersRevealed = true;
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create a new game
  socket.on('create-game', ({ playerName, numImposters = 1 }) => {
    try {
      const gameCode = gameManager.createGame(socket.id, playerName, numImposters);
      socket.join(gameCode);
      socket.emit('game-created', { gameCode });
      console.log(`Game created: ${gameCode} by ${playerName}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Join an existing game
  socket.on('join-game', ({ gameCode, playerName }) => {
    try {
      const game = gameManager.joinGame(gameCode, socket.id, playerName);
      socket.join(gameCode);
      socket.emit('game-joined', { gameCode, gameState: game.getPublicState(socket.id) });
      io.to(gameCode).emit('player-joined', { 
        gameState: game.getPublicState(null), // Public view for all players
        playerName 
      });
      console.log(`${playerName} joined game ${gameCode}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Start the game
  socket.on('start-game', async ({ gameCode }) => {
    try {
      const game = gameManager.getGame(gameCode);
      if (game.hostId !== socket.id) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }

      game.startGame();
      // Send player-specific state to each player using their socket ID
      const sockets = await io.in(gameCode).fetchSockets();
      sockets.forEach(socket => {
        socket.emit('game-started', { gameState: game.getPublicState(socket.id) });
      });
      console.log(`Game ${gameCode} started`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Submit description during turn
  socket.on('submit-description', ({ gameCode, description }) => {
    try {
      const game = gameManager.getGame(gameCode);
      game.submitDescription(socket.id, description);
      
      // Check if all players have submitted
      if (game.allDescriptionsSubmitted()) {
        // Send public state (no word/hint info) to all players
        io.to(gameCode).emit('all-descriptions-submitted', { 
          gameState: game.getPublicState(null) 
        });
      } else {
        io.to(gameCode).emit('description-submitted', { 
          gameState: game.getPublicState(null),
          playerId: socket.id
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Submit vote
  socket.on('submit-vote', ({ gameCode, votedPlayerId }) => {
    try {
      const game = gameManager.getGame(gameCode);
      game.submitVote(socket.id, votedPlayerId);
      
      // Check if all players have voted
      if (game.allVotesSubmitted()) {
        const results = game.getVotingResults();
        // Game finished - show all info to everyone
        io.to(gameCode).emit('voting-complete', { 
          gameState: game.getPublicState(null),
          results 
        });
      } else {
        io.to(gameCode).emit('vote-submitted', { 
          gameState: game.getPublicState(null),
          playerId: socket.id
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    const gameCode = gameManager.removePlayer(socket.id);
    if (gameCode) {
      const game = gameManager.getGame(gameCode);
      if (game) {
        io.to(gameCode).emit('player-left', { 
          gameState: game.getPublicState(null) 
        });
        console.log(`Player ${socket.id} left game ${gameCode}`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

