import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Player } from "../types.ts";
import { soundManager } from "../lib/sounds.ts";

interface PlayerTokenProps {
  player: Player;
  lastMove?: {
    playerId: string;
    from: number;
    to: number;
    intermediate?: number;
    isSnakeOrLadder: boolean;
  } | null;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({ player, lastMove }) => {
  const tokenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = async () => {
      if (!tokenRef.current) return;

      const getCoords = (pos: number) => {
        const cell = document.getElementById(`cell-${pos}`);
        if (!cell) return null;
        const rect = cell.getBoundingClientRect();
        const board = cell.parentElement?.parentElement?.getBoundingClientRect();
        if (!board) return null;
        return {
          x: rect.left - board.left + rect.width / 2,
          y: rect.top - board.top + rect.height / 2,
        };
      };

      // If we have a lastMove, we animate the path
      if (lastMove) {
        const tl = gsap.timeline();
        const { from, to, path, isSnakeOrLadder } = lastMove;

        // Step 1: Animate through the path
        for (let i = 0; i < path.length; i++) {
          const nextCell = path[i];
          const coords = getCoords(nextCell);
          if (!coords) continue;

          // Check if this is the final jump (snake or ladder)
          const isFinalJump = isSnakeOrLadder && i === path.length - 1;
          const prevCell = i === 0 ? from : path[i - 1];

          if (isFinalJump) {
            // Snake or Ladder jump animation
            tl.to({}, { duration: 0.3 }); // Brief pause at the snake/ladder head
            tl.to(tokenRef.current, {
              x: coords.x,
              y: coords.y,
              duration: 1.2,
              ease: nextCell < prevCell ? "power1.inOut" : "back.out(1.7)",
              onStart: () => {
                if (nextCell < prevCell) {
                  soundManager.play("snake");
                } else {
                  soundManager.play("ladder");
                }
              },
            });
          } else {
            // Normal hop animation
            tl.to(tokenRef.current, {
              x: coords.x,
              y: coords.y - 15, // Hop up
              duration: 0.15,
              ease: "power2.out",
              onStart: () => soundManager.play("move"),
            });
            tl.to(tokenRef.current, {
              y: coords.y, // Land
              duration: 0.15,
              ease: "power2.in",
            });
          }
        }
        
        return;
      }

      // Default jump (for initial join or if no lastMove context)
      const coords = getCoords(player.position);
      if (coords) {
        gsap.to(tokenRef.current, {
          x: coords.x,
          y: coords.y,
          duration: 0.6,
          ease: "back.out(1.7)",
        });
      }
    };

    updatePosition();
    const timeout = setTimeout(updatePosition, 50);
    return () => clearTimeout(timeout);
  }, [player.position, lastMove]);

  return (
    <div
      ref={tokenRef}
      className="absolute w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-xl rounded-lg shadow-xl z-50 -translate-x-1/2 -translate-y-1/2 pointer-events-none border-2 border-white"
      style={{
        backgroundColor: player.color,
        left: 0,
        top: 0,
      }}
    >
      <span className="drop-shadow-md">{player.avatar}</span>
    </div>
  );
};

export default PlayerToken;
