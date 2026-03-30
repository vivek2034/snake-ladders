import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { SNAKES, LADDERS, COLORS } from "./src/constants.ts";
import { Player, GameState } from "./src/types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = Number(process.env.PORT) || 3000;

  // Game Rooms
  const rooms = new Map<string, GameState>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    let currentRoomId: string | null = null;

    socket.on("joinGame", (name: string, avatar: string, roomId: string) => {
      currentRoomId = roomId;
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          players: [],
          turnIndex: 0,
          isStarted: false,
          isGameOver: false,
          winner: null,
          lastRoll: null,
          lastMove: null,
        });
      }

      const gameState = rooms.get(roomId)!;

      if (gameState.players.length >= 4) {
        socket.emit("chatMessage", { user: "System", text: "Game is full (max 4 players)." });
        return;
      }

      const newPlayer: Player = {
        id: socket.id,
        name: name || `Player ${gameState.players.length + 1}`,
        position: 1,
        color: COLORS[gameState.players.length % COLORS.length],
        avatar: avatar || "🐶",
      };

      gameState.players.push(newPlayer);
      
      // Auto-start if 2 or more players
      if (gameState.players.length >= 2 && !gameState.isStarted) {
        gameState.isStarted = true;
        io.to(roomId).emit("chatMessage", { user: "System", text: "🎮 Game started! Good luck!" });
      }

      io.to(roomId).emit("gameStateUpdate", gameState);
      io.to(roomId).emit("chatMessage", { user: "System", text: `${newPlayer.name} joined the game!` });
    });

    socket.on("rollDice", () => {
      if (!currentRoomId) return;
      const gameState = rooms.get(currentRoomId);
      if (!gameState || !gameState.isStarted) return;

      const currentPlayer = gameState.players[gameState.turnIndex];
      if (!currentPlayer || currentPlayer.id !== socket.id || gameState.isGameOver) {
        return;
      }

      const roll = Math.floor(Math.random() * 6) + 1;
      gameState.lastRoll = roll;
      io.to(currentRoomId).emit("diceRolled", roll, currentPlayer.id);

      const oldPos = currentPlayer.position;
      let finalPos = oldPos + roll;
      const path: number[] = [];
      let isSnakeOrLadder = false;

      // Calculate the move path
      if (finalPos > 100) {
        // Bounce back: if you roll 5 at 98, you go 99, 100, 99, 98, 97
        const overshoot = finalPos - 100;
        // Forward to 100
        for (let i = oldPos + 1; i <= 100; i++) {
          path.push(i);
        }
        // Backward for overshoot
        for (let i = 1; i <= overshoot; i++) {
          path.push(100 - i);
        }
        finalPos = 100 - overshoot;
      } else {
        // Normal move
        for (let i = oldPos + 1; i <= finalPos; i++) {
          path.push(i);
        }
      }

      // Check for snakes or ladders at the final position
      if (SNAKES[finalPos]) {
        finalPos = SNAKES[finalPos];
        path.push(finalPos); // Jump to snake tail
        isSnakeOrLadder = true;
      } else if (LADDERS[finalPos]) {
        finalPos = LADDERS[finalPos];
        path.push(finalPos); // Jump to ladder top
        isSnakeOrLadder = true;
      }

      currentPlayer.position = finalPos;
      
      gameState.lastMove = {
        playerId: currentPlayer.id,
        from: oldPos,
        to: finalPos,
        path,
        isSnakeOrLadder,
      };

      if (finalPos === 100) {
        gameState.isGameOver = true;
        gameState.winner = currentPlayer;
        io.to(currentRoomId).emit("chatMessage", { user: "System", text: `🎉 ${currentPlayer.name} WON THE GAME!` });
      }

      // Move to next turn
      gameState.turnIndex = (gameState.turnIndex + 1) % gameState.players.length;
      
      io.to(currentRoomId).emit("gameStateUpdate", gameState);
    });

    socket.on("sendMessage", (text: string) => {
      if (!currentRoomId) return;
      const gameState = rooms.get(currentRoomId);
      if (!gameState) return;

      const player = gameState.players.find(p => p.id === socket.id);
      if (player) {
        io.to(currentRoomId).emit("chatMessage", { user: player.name, text });
      }
    });

    socket.on("rematch", () => {
      console.log("Rematch requested in room:", currentRoomId);
      if (!currentRoomId) return;
      const gameState = rooms.get(currentRoomId);
      if (!gameState || !gameState.isGameOver) {
        console.log("Rematch ignored: game not over or room not found");
        return;
      }

      // Reset game state but keep players
      gameState.players.forEach(p => p.position = 1);
      gameState.turnIndex = 0;
      gameState.isStarted = gameState.players.length >= 2;
      gameState.isGameOver = false;
      gameState.winner = null;
      gameState.lastRoll = null;
      gameState.lastMove = null;

      io.to(currentRoomId).emit("gameStateUpdate", gameState);
      io.to(currentRoomId).emit("chatMessage", { user: "System", text: "🔄 Game restarted! Good luck!" });
      console.log("Game restarted in room:", currentRoomId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (!currentRoomId) return;
      const gameState = rooms.get(currentRoomId);
      if (!gameState) return;

      const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const playerName = gameState.players[playerIndex].name;
        gameState.players.splice(playerIndex, 1);
        
        // Adjust turn index if needed
        if (gameState.players.length === 0) {
          rooms.delete(currentRoomId);
        } else {
          if (gameState.players.length < 2) {
            gameState.isStarted = false;
          }
          gameState.turnIndex = gameState.turnIndex % gameState.players.length;
          io.to(currentRoomId).emit("gameStateUpdate", gameState);
          io.to(currentRoomId).emit("chatMessage", { user: "System", text: `${playerName} left the game.` });
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
