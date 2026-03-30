/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Player, GameState, ServerToClientEvents, ClientToServerEvents } from "./types.ts";
import { AVATARS } from "./constants.ts";
import Board from "./components/Board.tsx";
import PlayerToken from "./components/PlayerToken.tsx";
import Dice from "./components/Dice.tsx";
import { soundManager } from "./lib/sounds.ts";
import { Dice5, MessageSquare, Users, Trophy, LogIn, Volume2, VolumeX, Share2, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [isJoined, setIsJoined] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [activeTab, setActiveTab] = useState<"game" | "players" | "chat">("game");
  const [chatInput, setChatInput] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let room = params.get("room");
    if (!room) {
      room = Math.random().toString(36).substring(2, 9);
      const newUrl = `${window.location.pathname}?room=${room}`;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
    setRoomId(room);
  }, []);

  useEffect(() => {
    soundManager.toggle(soundEnabled);
  }, [soundEnabled]);

  // Handle window resize to keep tokens aligned
  useEffect(() => {
    const handleResize = () => {
      setGameState(prev => prev ? { ...prev } : null);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    socket.on("gameStateUpdate", (state: GameState) => {
      const wasMyTurn = gameState?.players[gameState.turnIndex]?.id === socket.id;
      const isMyTurn = state.players[state.turnIndex]?.id === socket.id;
      const playerJoined = (state.players.length > (gameState?.players.length || 0));
      
      setGameState(state);
      setIsRolling(false);
      
      if (state.isGameOver) {
        soundManager.play("win");
      } else if (!wasMyTurn && isMyTurn) {
        soundManager.play("ladder"); // Using ladder chime for turn notification
      } else if (playerJoined) {
        soundManager.play("ladder");
      }
    });

    socket.on("chatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.user !== "System") {
        soundManager.play("notification");
      }
    });

    socket.on("diceRolled", (roll, playerId) => {
      if (playerId === socket.id) {
        setIsRolling(true);
        setTimeout(() => setIsRolling(false), 1000);
      }
    });

    return () => {
      socket.off("gameStateUpdate");
      socket.off("chatMessage");
      socket.off("diceRolled");
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && roomId) {
      socket.emit("joinGame", name, avatar, roomId);
      setIsJoined(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoll = () => {
    if (gameState && gameState.players[gameState.turnIndex]?.id === socket.id && !gameState.isGameOver) {
      soundManager.play("move");
      socket.emit("rollDice");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socket.emit("sendMessage", chatInput);
      setChatInput("");
    }
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-indigo-100"
        >
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
              <Dice5 className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Snakes & Ladders</h1>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">Room: {roomId}</p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-0 transition-all text-lg font-medium outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Choose Avatar</label>
              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    className={`text-3xl p-3 rounded-2xl transition-all border-2
                      ${avatar === a ? "bg-indigo-50 border-indigo-500 scale-110 shadow-md" : "bg-gray-50 border-transparent hover:bg-gray-100"}
                    `}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-lg active:scale-95"
            >
              <LogIn className="w-6 h-6" />
              JOIN GAME
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const currentPlayer = gameState?.players[gameState.turnIndex];
  const isMyTurn = currentPlayer?.id === socket.id;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Dice5 className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-lg tracking-tight">S&L Multi</span>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition-all ${soundEnabled ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button 
            onClick={() => setActiveTab("players")}
            className={`p-2 rounded-xl transition-all ${activeTab === "players" ? "bg-indigo-100 text-indigo-600" : "text-slate-400"}`}
          >
            <Users className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className={`p-2 rounded-xl transition-all ${activeTab === "chat" ? "bg-indigo-100 text-indigo-600" : "text-slate-400"}`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab("game")}
            className={`p-2 rounded-xl transition-all ${activeTab === "game" ? "bg-indigo-100 text-indigo-600" : "text-slate-400"}`}
          >
            <Dice5 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Sidebar: Players (Hidden on mobile unless active) */}
        <aside className={`
          w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm z-[70]
          fixed inset-0 lg:relative lg:inset-auto lg:translate-x-0 transition-transform duration-300
          ${activeTab === "players" ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${activeTab !== "players" ? "pointer-events-none lg:pointer-events-auto" : "pointer-events-auto"}
        `}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="text-indigo-600 w-6 h-6" />
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight leading-none">Players</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Room: {roomId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopyLink}
                className={`p-2 rounded-xl transition-all hover:bg-slate-100 ${copied ? "text-green-600" : "text-slate-400"}`}
                title="Copy Share Link"
              >
                {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl transition-all hover:bg-slate-100 ${soundEnabled ? "text-indigo-600" : "text-slate-400"}`}
                title={soundEnabled ? "Mute" : "Unmute"}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button 
                className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all" 
                onClick={() => setActiveTab("game")}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {gameState?.players.map((p) => (
              <motion.div
                key={p.id}
                layout
                className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4
                  ${currentPlayer?.id === p.id ? "border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]" : "border-slate-100 bg-white"}
                `}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatar}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-black text-slate-900 leading-tight truncate">{p.name}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase">Cell {p.position}</p>
                </div>
                {currentPlayer?.id === p.id && (
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-ping shrink-0" />
                )}
              </motion.div>
            ))}
          </div>

          {gameState?.isGameOver && (
            <div className="p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-amber-100 border-2 border-amber-400 p-6 rounded-3xl text-center shadow-xl"
              >
                <Trophy className="w-10 h-10 text-amber-600 mx-auto mb-2" />
                <h3 className="text-xl font-black text-amber-900 leading-tight">WINNER!</h3>
                <p className="text-amber-800 font-bold">{gameState.winner?.name}</p>
                <button
                  onClick={() => socket.emit("rematch")}
                  className="mt-4 w-full bg-amber-600 text-white py-2 rounded-xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                >
                  <Dice5 className="w-4 h-4" />
                  REMATCH
                </button>
              </motion.div>
            </div>
          )}
        </aside>

        {/* Main Game Area */}
        <main className={`
          flex-grow flex flex-col items-center justify-center p-4 lg:p-8 gap-6 bg-slate-100/50 overflow-y-auto
          ${activeTab !== "game" ? "hidden lg:flex" : "flex"}
        `}>
          <div className="relative w-full max-w-[550px] mx-auto">
            <Board />
            {gameState?.players.map((p) => (
              <PlayerToken 
                key={p.id} 
                player={p} 
                lastMove={gameState.lastMove?.playerId === p.id ? gameState.lastMove : null}
              />
            ))}
          </div>

          <div className="w-full max-w-[550px] bg-white p-4 sm:p-6 rounded-[2rem] shadow-xl flex items-center justify-between gap-4 border border-slate-200">
            <div className="flex-grow">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Turn</p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                  style={{ backgroundColor: currentPlayer?.color || '#eee' }}
                >
                  {currentPlayer?.avatar || '?'}
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 leading-tight truncate max-w-[120px]">
                    {!gameState?.isStarted ? "Waiting..." : isMyTurn ? "Your Turn!" : currentPlayer?.name || "Waiting..."}
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    {gameState?.isGameOver 
                      ? "Game Over" 
                      : !gameState?.isStarted 
                      ? "Need 2+ players" 
                      : isMyTurn 
                      ? "Roll the dice!" 
                      : "Please wait..."}
                  </p>
                </div>
              </div>
            </div>
            
            <Dice
              roll={gameState?.lastRoll || 1}
              isRolling={isRolling}
              onRoll={handleRoll}
              disabled={!isMyTurn || gameState?.isGameOver || !gameState?.isStarted || false}
            />
          </div>
        </main>

        {/* Right Sidebar: Chat (Hidden on mobile unless active) */}
        <aside className={`
          w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm z-[70]
          fixed inset-0 lg:relative lg:inset-auto lg:translate-x-0 transition-transform duration-300
          ${activeTab === "chat" ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          ${activeTab !== "chat" ? "pointer-events-none lg:pointer-events-auto" : "pointer-events-auto"}
        `}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-indigo-600 w-6 h-6" />
              <h2 className="text-xl font-black uppercase tracking-tight">Chat</h2>
            </div>
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all" 
              onClick={() => setActiveTab("game")}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.user === name ? "items-end" : "items-start"}`}>
                <span className={`text-[9px] font-black uppercase tracking-wider mb-0.5 px-1
                  ${msg.user === "System" ? "text-indigo-500" : "text-slate-400"}
                `}>
                  {msg.user}
                </span>
                <div className={`px-4 py-2 rounded-2xl text-sm font-medium shadow-sm max-w-[85%]
                  ${msg.user === "System" 
                    ? "bg-indigo-100 text-indigo-900 italic border border-indigo-200" 
                    : msg.user === name
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"}
                `}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message..."
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-sm"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              >
                <LogIn className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}

