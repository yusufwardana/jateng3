import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Kecamatan } from '../types';
import { useMapStore } from '../store';
import { cn } from '../lib/utils';

interface MapKecamatanProps {
  kecamatan: Kecamatan;
}

export const MapKecamatan: React.FC<MapKecamatanProps> = ({ kecamatan }) => {
  const { selectedKecamatanId, setSelectedKecamatan, updateKecamatan, isAllLocked, user } = useMapStore();
  const [isDragging, setIsDragging] = useState(false);
  const [bbox, setBbox] = useState<DOMRect | null>(null);
  const pathRef = useRef<SVGPathElement>(null);
  
  const isSelected = selectedKecamatanId === kecamatan.id;
  const isLocked = isAllLocked || kecamatan.isLocked || !user; // Lock if not logged in

  useEffect(() => {
    if (pathRef.current) {
      setBbox(pathRef.current.getBBox());
    }
  }, [kecamatan.path]);

  return (
    <motion.g
      drag={!isLocked}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        const snap = 10;
        const newX = Math.round((kecamatan.position.x + info.offset.x) / snap) * snap;
        const newY = Math.round((kecamatan.position.y + info.offset.y) / snap) * snap;
        
        updateKecamatan(kecamatan.id, {
          position: { x: newX, y: newY }
        });
      }}
      whileDrag={{ 
        scale: 1.02,
        filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.2))',
        transition: { duration: 0.1 }
      }}
      initial={false}
      animate={{ 
        x: kecamatan.position.x, 
        y: kecamatan.position.y,
        scale: kecamatan.scale || 1,
        opacity: 1
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedKecamatan(kecamatan.id);
      }}
      className={cn(
        "transition-all duration-200",
        isLocked ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      )}
    >
      {/* Ghost Image (Original Position) */}
      {isDragging && (
        <path
          d={kecamatan.path}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth={1}
          strokeDasharray="4 2"
          className="pointer-events-none"
          style={{ transform: `translate(${-kecamatan.position.x}px, ${-kecamatan.position.y}px)` }}
        />
      )}

      {/* Bounding Box */}
      {(isDragging || isSelected) && bbox && (
        <rect
          x={bbox.x - 4}
          y={bbox.y - 4}
          width={bbox.width + 8}
          height={bbox.height + 8}
          fill="none"
          stroke={isDragging ? "#3b82f6" : "#94a3b8"}
          strokeWidth={isDragging ? 1.5 : 1}
          strokeDasharray={isDragging ? "4 2" : "none"}
          rx="4"
          className="pointer-events-none transition-colors"
        />
      )}

      <path
        ref={pathRef}
        d={kecamatan.path}
        fill={kecamatan.color}
        stroke={isSelected ? '#1e293b' : '#64748b'}
        strokeWidth={isSelected ? 2 : 1}
        className="transition-colors duration-200 hover:opacity-90"
      />

      {kecamatan.label && (
        <text
          x={bbox ? bbox.x + bbox.width / 2 : "50%"}
          y={bbox ? bbox.y + bbox.height / 2 : "50%"}
          textAnchor="middle"
          dominantBaseline="middle"
          className="pointer-events-none select-none text-[10px] font-bold fill-slate-800"
          style={{ textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}
        >
          {kecamatan.label}
        </text>
      )}
    </motion.g>
  );
};
