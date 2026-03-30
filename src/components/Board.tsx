import React, { useMemo } from "react";
import { SNAKES, LADDERS } from "../constants.ts";
import { motion } from "motion/react";

const Snake: React.FC<{ start: { x: number, y: number }, end: { x: number, y: number }, id: string }> = ({ start, end, id }) => {
  // Create a wavy path for the snake
  const path = useMemo(() => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Control points for a wavy snake
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Perpendicular vector for wave offset
    const nx = -dy / dist;
    const ny = dx / dist;
    
    const waveSize = 4;
    const cp1x = start.x + dx * 0.33 + nx * waveSize;
    const cp1y = start.y + dy * 0.33 + ny * waveSize;
    const cp2x = start.x + dx * 0.66 - nx * waveSize;
    const cp2y = start.y + dy * 0.66 - ny * waveSize;
    
    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`;
  }, [start, end]);

  return (
    <g key={`snake-${id}`} opacity="0.9">
      {/* Snake Body Shadow */}
      <motion.path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        style={{ transform: "translate(0.5px, 0.5px)" }}
      />
      
      {/* Snake Body */}
      <motion.path
        d={path}
        fill="none"
        stroke="#166534"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1, 2"
        initial={{ pathLength: 0, strokeDashoffset: 0 }}
        animate={{ 
          pathLength: 1,
          strokeDashoffset: [0, 10]
        }}
        transition={{ 
          pathLength: { duration: 1.5, ease: "easeInOut" },
          strokeDashoffset: { duration: 2, repeat: Infinity, ease: "linear" }
        }}
      />
      
      {/* Main Body Color */}
      <motion.path
        d={path}
        fill="none"
        stroke="#22c55e"
        strokeWidth="1.8"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Snake Head */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2, type: "spring" }}
      >
        <circle cx={start.x} cy={start.y} r="2.2" fill="#166534" />
        <circle cx={start.x - 0.6} cy={start.y - 0.6} r="0.4" fill="white" />
        <circle cx={start.x + 0.6} cy={start.y - 0.6} r="0.4" fill="white" />
        <circle cx={start.x - 0.6} cy={start.y - 0.6} r="0.2" fill="black" />
        <circle cx={start.x + 0.6} cy={start.y - 0.6} r="0.2" fill="black" />
        
        {/* Tongue */}
        <motion.path
          d={`M ${start.x} ${start.y - 1.5} L ${start.x} ${start.y - 3.5} M ${start.x} ${start.y - 3.5} L ${start.x - 0.5} ${start.y - 4.5} M ${start.x} ${start.y - 3.5} L ${start.x + 0.5} ${start.y - 4.5}`}
          stroke="#ef4444"
          strokeWidth="0.4"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          style={{ originY: "top" }}
        />
      </motion.g>
    </g>
  );
};

const Board: React.FC = () => {
  const cells = useMemo(() => {
    const arr = Array.from({ length: 100 }, (_, i) => 100 - i);
    const reordered: number[] = [];
    for (let row = 0; row < 10; row++) {
      const rowCells = arr.slice(row * 10, (row + 1) * 10);
      if (row % 2 !== 0) {
        reordered.push(...rowCells.reverse());
      } else {
        reordered.push(...rowCells);
      }
    }
    return reordered;
  }, []);

  // Helper to get center coordinates of a cell (0-9 for x and y)
  const getCellCoords = (cell: number) => {
    const row = Math.floor((cell - 1) / 10);
    const col = (cell - 1) % 10;
    const x = row % 2 === 0 ? col : 9 - col;
    const y = 9 - row;
    return { x: x * 10 + 5, y: y * 10 + 5 }; // Percentage based
  };

  return (
    <div 
      className="relative w-full aspect-square bg-amber-50 border-8 border-amber-900 shadow-2xl rounded-xl overflow-hidden"
      style={{ minHeight: '300px' }}
    >
      {/* Grid Background */}
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
        {cells.map((cell) => {
          const row = Math.floor((cell - 1) / 10);
          const isEvenRow = row % 2 === 0;
          const isEvenCol = (cell - 1) % 2 === 0;
          const bgColor = (isEvenRow ? isEvenCol : !isEvenCol) 
            ? "bg-orange-100" 
            : "bg-orange-200";

          return (
            <div
              key={cell}
              id={`cell-${cell}`}
              className={`relative flex items-center justify-center border border-amber-900/10 ${bgColor}`}
            >
              <span className="text-[10px] font-black text-amber-900/40 absolute top-1 left-1">
                {cell}
              </span>
              {cell === 1 && (
                <span className="text-[8px] font-black text-green-600 absolute bottom-1 right-1 uppercase">Start</span>
              )}
              {cell === 100 && (
                <span className="text-[8px] font-black text-red-600 absolute bottom-1 right-1 uppercase">Finish</span>
              )}
            </div>
          );
        })}
      </div>

      {/* SVG Layer for Snakes and Ladders */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-10" 
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ladderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="50%" stopColor="#A0522D" />
            <stop offset="100%" stopColor="#8B4513" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Ladders */}
        {Object.entries(LADDERS).map(([start, end]) => {
          const s = getCellCoords(parseInt(start));
          const e = getCellCoords(end);
          return (
            <motion.g 
              key={`ladder-${start}`} 
              opacity="0.8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.8, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              {/* Rails */}
              <line 
                x1={s.x - 1.5} y1={s.y} x2={e.x - 1.5} y2={e.y} 
                stroke="url(#ladderGrad)" strokeWidth="1.8" 
                strokeLinecap="round"
              />
              <line 
                x1={s.x + 1.5} y1={s.y} x2={e.x + 1.5} y2={e.y} 
                stroke="url(#ladderGrad)" strokeWidth="1.8" 
                strokeLinecap="round"
              />
              {/* Rungs */}
              {Array.from({ length: 8 }).map((_, i) => {
                const t = (i + 1) / 9;
                const rx = s.x + (e.x - s.x) * t;
                const ry = s.y + (e.y - s.y) * t;
                return (
                  <line 
                    key={i}
                    x1={rx - 2} y1={ry} x2={rx + 2} y2={ry}
                    stroke="#5D2E0A" strokeWidth="1"
                    strokeLinecap="round"
                  />
                );
              })}
            </motion.g>
          );
        })}

        {/* Snakes */}
        {Object.entries(SNAKES).map(([start, end]) => {
          const s = getCellCoords(parseInt(start));
          const e = getCellCoords(end);
          return <Snake key={`snake-${start}`} id={start} start={s} end={e} />;
        })}
      </svg>
    </div>
  );
};

export default Board;
