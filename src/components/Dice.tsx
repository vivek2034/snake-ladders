import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundManager } from "../lib/sounds.ts";

interface DiceProps {
  roll: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled: boolean;
}

const Dice: React.FC<DiceProps> = ({ roll, isRolling, onRoll, disabled }) => {
  const [displayRoll, setDisplayRoll] = useState(roll || 1);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (isRolling) {
      soundManager.play("dice");
      const interval = setInterval(() => {
        setDisplayRoll(Math.floor(Math.random() * 6) + 1);
      }, 80);
      return () => clearInterval(interval);
    } else {
      if (roll) {
        soundManager.play("move"); // "Thud" on landing
        setDisplayRoll(roll);
        // Set final rotation based on roll
        const finalRotations: Record<number, { x: number, y: number }> = {
          1: { x: 0, y: 0 },
          2: { x: 0, y: -90 },
          3: { x: -90, y: 0 },
          4: { x: 90, y: 0 },
          5: { x: 0, y: 90 },
          6: { x: 180, y: 0 },
        };
        setRotation({ 
          ...finalRotations[roll], 
          z: (Math.random() - 0.5) * 15 // Small random wobble on landing
        });
        // Settle the wobble after a moment
        setTimeout(() => {
          setRotation(prev => ({ ...prev, z: 0 }));
        }, 600);
      }
    }
  }, [isRolling, roll]);

  const renderDots = (num: number) => {
    const dotPositions: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-8 h-8 sm:w-12 sm:h-12">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dotPositions[num].includes(i) && (
              <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 bg-slate-900 rounded-full shadow-inner" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const faceStyles = "absolute inset-0 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-inner [backface-visibility:hidden]";
  const size = "w-16 h-16 sm:w-20 sm:h-20";
  const translateZ = "translateZ(32px) sm:translateZ(40px)";

  return (
    <div className="flex items-center gap-6">
      <div className="relative [perspective:1000px]">
        {/* Shadow */}
        <motion.div 
          animate={isRolling ? { 
            scale: [1, 0.8, 1.1, 0.9, 1],
            opacity: [0.2, 0.1, 0.3, 0.15, 0.2]
          } : { scale: 1, opacity: 0.2 }}
          transition={{ repeat: isRolling ? Infinity : 0, duration: 0.5 }}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/40 blur-md rounded-full"
        />

        <motion.div
          animate={isRolling ? { 
            rotateX: [rotation.x, rotation.x + 1440],
            rotateY: [rotation.y, rotation.y + 1800],
            rotateZ: [rotation.z, rotation.z + 720],
            y: [0, -80, 0, -40, 0],
            scale: [1, 1.2, 0.8, 1.1, 1]
          } : { 
            rotateX: rotation.x,
            rotateY: rotation.y,
            rotateZ: rotation.z,
            y: 0,
            scale: 1
          }}
          transition={isRolling ? { 
            rotateX: { repeat: Infinity, duration: 0.5, ease: "linear" },
            rotateY: { repeat: Infinity, duration: 0.7, ease: "linear" },
            rotateZ: { repeat: Infinity, duration: 0.9, ease: "linear" },
            y: { repeat: Infinity, duration: 0.3, ease: "easeInOut" },
            scale: { repeat: Infinity, duration: 0.3, ease: "easeInOut" }
          } : { 
            type: "spring", 
            stiffness: 300, 
            damping: 10,
            mass: 1.8,
            restDelta: 0.001
          }}
          style={{ transformStyle: "preserve-3d" }}
          className={`${size} relative cursor-pointer`}
          onClick={!disabled && !isRolling ? onRoll : undefined}
        >
          {/* Face 1 (Front) */}
          <div className={faceStyles} style={{ transform: `${translateZ}` }}>
            {renderDots(1)}
          </div>
          {/* Face 6 (Back) */}
          <div className={faceStyles} style={{ transform: `rotateY(180deg) ${translateZ}` }}>
            {renderDots(6)}
          </div>
          {/* Face 2 (Right) */}
          <div className={faceStyles} style={{ transform: `rotateY(90deg) ${translateZ}` }}>
            {renderDots(2)}
          </div>
          {/* Face 5 (Left) */}
          <div className={faceStyles} style={{ transform: `rotateY(-90deg) ${translateZ}` }}>
            {renderDots(5)}
          </div>
          {/* Face 3 (Top) */}
          <div className={faceStyles} style={{ transform: `rotateX(90deg) ${translateZ}` }}>
            {renderDots(3)}
          </div>
          {/* Face 4 (Bottom) */}
          <div className={faceStyles} style={{ transform: `rotateX(-90deg) ${translateZ}` }}>
            {renderDots(4)}
          </div>
        </motion.div>
      </div>

      <button
        disabled={disabled || isRolling}
        onClick={onRoll}
        className={`px-6 sm:px-10 py-3 rounded-2xl font-black text-sm sm:text-base text-white shadow-lg transition-all uppercase tracking-widest
          ${disabled || isRolling 
            ? "bg-slate-300 cursor-not-allowed shadow-none" 
            : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-200"}
        `}
      >
        {isRolling ? "..." : "Roll"}
      </button>
    </div>
  );
};

export default Dice;
