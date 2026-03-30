import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (isRolling) {
      soundManager.play("dice");
      const interval = setInterval(() => {
        setDisplayRoll(Math.floor(Math.random() * 6) + 1);
      }, 80);
      return () => clearInterval(interval);
    } else {
      setDisplayRoll(roll || 1);
    }
  }, [isRolling, roll]);

  const renderDots = (num: number) => {
    const dotPositions: Record<number, string[]> = {
      1: ["center"],
      2: ["top-right", "bottom-left"],
      3: ["top-right", "center", "bottom-left"],
      4: ["top-left", "top-right", "bottom-left", "bottom-right"],
      5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
      6: ["top-left", "top-right", "center-left", "center-right", "bottom-left", "bottom-right"],
    };

    const positions: Record<string, string> = {
      "top-left": "top-2 left-2 sm:top-3 sm:left-3",
      "top-right": "top-2 right-2 sm:top-3 sm:right-3",
      "center-left": "top-1/2 left-2 sm:left-3 -translate-y-1/2",
      "center-right": "top-1/2 right-2 sm:right-3 -translate-y-1/2",
      "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      "bottom-left": "bottom-2 left-2 sm:bottom-3 sm:left-3",
      "bottom-right": "bottom-2 right-2 sm:bottom-3 sm:right-3",
    };

    return (
      <div className="relative w-full h-full p-2">
        {dotPositions[num].map((pos, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 sm:w-3 sm:h-3 bg-slate-800 rounded-full ${positions[pos]}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4">
      <motion.div
        animate={isRolling ? { 
          rotateX: [0, 180, 360, 540, 720],
          rotateY: [0, 90, 180, 270, 360],
          scale: [1, 1.2, 0.9, 1.1, 1],
          y: [0, -20, 0, -10, 0],
          boxShadow: [
            "0 0 0px rgba(79, 70, 229, 0)",
            "0 0 20px rgba(79, 70, 229, 0.5)",
            "0 0 0px rgba(79, 70, 229, 0)"
          ]
        } : { rotateX: 0, rotateY: 0, scale: 1, y: 0, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        transition={{ 
          repeat: isRolling ? Infinity : 0, 
          duration: 0.6,
          ease: "easeInOut"
        }}
        className={`w-14 h-14 sm:w-20 sm:h-20 bg-white border-4 border-slate-800 rounded-2xl shadow-xl flex items-center justify-center relative
          ${disabled ? "opacity-30 grayscale" : "cursor-pointer hover:bg-slate-50 active:scale-90 transition-transform"}
        `}
        onClick={!disabled && !isRolling ? onRoll : undefined}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayRoll}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.1 }}
            className="w-full h-full"
          >
            {renderDots(displayRoll)}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <button
        disabled={disabled || isRolling}
        onClick={onRoll}
        className={`px-4 sm:px-8 py-3 rounded-2xl font-black text-sm sm:text-base text-white shadow-lg transition-all uppercase tracking-widest
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
