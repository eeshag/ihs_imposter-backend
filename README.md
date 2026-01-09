# IHS Imposter Backend

WebSocket backend service for the IHS Imposter game using Socket.io.

## Features

- Real-time multiplayer game management
- WebSocket communication for instant updates
- Game room creation and joining with 6-character codes
- Player role assignment (imposter/non-imposter)
- Turn-based gameplay
- Voting system
- IHS-themed word lists

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on port 3001 (or the port specified in the PORT environment variable).

## Socket Events

### Client → Server

- `create-game`: Create a new game
  - `{ playerName: string, numImposters?: number }`
- `join-game`: Join an existing game
  - `{ gameCode: string, playerName: string }`
- `start-game`: Start the game (host only)
  - `{ gameCode: string }`
- `submit-description`: Submit description during turn
  - `{ gameCode: string, description: string }`
- `submit-vote`: Vote for a player
  - `{ gameCode: string, votedPlayerId: string }`

### Server → Client

- `game-created`: Game created successfully
  - `{ gameCode: string }`
- `game-joined`: Successfully joined game
  - `{ gameCode: string, gameState: object }`
- `player-joined`: Another player joined
  - `{ gameState: object, playerName: string }`
- `game-started`: Game has started
  - `{ gameState: object }`
- `description-submitted`: A player submitted their description
  - `{ gameState: object, playerId: string }`
- `all-descriptions-submitted`: All descriptions submitted, voting starts
  - `{ gameState: object }`
- `vote-submitted`: A player voted
  - `{ gameState: object, playerId: string }`
- `voting-complete`: All votes submitted, game finished
  - `{ gameState: object, results: object }`
- `player-left`: A player left the game
  - `{ gameState: object }`
- `error`: Error occurred
  - `{ message: string }`

## Game Rules

- Minimum 3 players, maximum 12 players
- At least 1 non-imposter must exist
- Players take turns describing the word (clockwise)
- Imposters only see a hint, not the actual word
- After all descriptions, players vote for who they think is the imposter

