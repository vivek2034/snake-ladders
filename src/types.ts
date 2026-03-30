export interface Player {
  id: string;
  name: string;
  position: number; // 1 to 100
  color: string;
  avatar: string;
}

export interface GameState {
  players: Player[];
  turnIndex: number;
  isStarted: boolean;
  isGameOver: boolean;
  winner: Player | null;
  lastRoll: number | null;
  lastMove: {
    playerId: string;
    from: number;
    to: number;
    path: number[]; // Array of cell numbers to visit in order
    isSnakeOrLadder: boolean;
  } | null;
}

export interface ServerToClientEvents {
  gameStateUpdate: (state: GameState) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  gameStarted: (state: GameState) => void;
  diceRolled: (roll: number, playerId: string) => void;
  movePlayer: (playerId: string, from: number, to: number, isSnakeOrLadder: boolean) => void;
  chatMessage: (msg: { user: string; text: string }) => void;
}

export interface ClientToServerEvents {
  joinGame: (name: string, avatar: string, roomId: string) => void;
  rollDice: () => void;
  sendMessage: (text: string) => void;
  rematch: () => void;
}
