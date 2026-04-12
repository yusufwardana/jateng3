import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Kecamatan } from '../types';
import { useMapStore } from '../store';
import { cn } from '../lib/utils';

interface MapKecamatanProps {
  kecamatan: Kecamatan;
}

export const MapKecamatan: React.FC<MapKecamatanProps> = ({ kecamatan }) => {
  const { 
    selectedKecamatanIds, 
    toggleKecamatanSelection,
    moveSelectedKecamatans,
    moveSelectedKecamatansExcept,
    updateKecamatan, 
    isAllLocked, 
    user, 
    zoom 
  } = useMapStore();
  const [isDragging, setIsDragging] = useState(false);
  const [bbox, setBbox] = useState<DOMRect | null>(null);
  const pathRef = useRef<SVGPathElement>(null);
  
  const isSelected = selectedKecamatanIds.includes(kecamatan.id);
  const isLocked = isAllLocked || kecamatan.isLocked || !user; // Lock if not logged in

  useEffect(() => {
    if (pathRef.current) {
      setBbox(pathRef.current.getBBox());
    }
  }, [kecamatan.path]);

  useEffect(() => {
    const element = pathRef.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      if (!isLocked && isSelected) {
        e.preventDefault();
        e.stopPropagation();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.max(0.1, Math.min(3, (kecamatan.scale || 1) + delta));
        
        if (selectedKecamatanIds.length > 1) {
          // Optional: scale all selected
          selectedKecamatanIds.forEach(id => {
            const k = useMapStore.getState().kecamatans.find(k => k.id === id);
            if (k && !k.isLocked) {
              updateKecamatan(id, { scale: Math.max(0.1, Math.min(3, (k.scale || 1) + delta)) });
            }
          });
        } else {
          updateKecamatan(kecamatan.id, { scale: newScale });
        }
      }
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [isLocked, isSelected, kecamatan.scale, kecamatan.id, updateKecamatan, selectedKecamatanIds]);

  return (
    <motion.g
      drag={!isLocked}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDrag={(_, info) => {
        if (selectedKecamatanIds.includes(kecamatan.id) && selectedKecamatanIds.length > 1) {
          const dx = info.delta.x / zoom;
          const dy = info.delta.y / zoom;
          moveSelectedKecamatansExcept(kecamatan.id, dx, dy);
        }
      }}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        const dx = info.offset.x / zoom;
        const dy = info.offset.y / zoom;
        
        updateKecamatan(kecamatan.id, {
          position: { 
            x: kecamatan.position.x + dx, 
            y: kecamatan.position.y + dy 
          }
        });
      }}
      whileDrag={{ 
        scale: (kecamatan.scale || 1) * 1.02,
        filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.2))',
      }}
      initial={false}
      animate={{ 
        x: kecamatan.position.x, 
        y: kecamatan.position.y,
        scale: kecamatan.scale || 1,
        opacity: 1
      }}
      style={{ 
        originX: bbox ? `${bbox.x + bbox.width / 2}px` : '50%',
        originY: bbox ? `${bbox.y + bbox.height / 2}px` : '50%'
      }}
      transition={{ type: 'tween', duration: 0.1 }}
      onClick={(e) => {
        e.stopPropagation();
        toggleKecamatanSelection(kecamatan.id, e.shiftKey);
      }}
      className={cn(
        "transition-colors duration-200 map-kecamatan",
        isLocked ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      )}
      data-id={kecamatan.id}
    >
      {/* Bounding Box */}
      {(isDragging || isSelected) && bbox && (
        <rect
          x={bbox.x - 4}
          y={bbox.y - 4}
          width={bbox.width + 8}
          height={bbox.height + 8}
          fill="none"
          stroke={isDragging ? "#f97316" : "#94a3b8"}
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
          className="pointer-events-none select-none text-[14px] font-extrabold fill-slate-900"
          style={{ 
            paintOrder: 'stroke',
            stroke: '#ffffff',
            strokeWidth: '3px',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.2))'
          }}
        >
          {kecamatan.label}
        </text>
      )}
    </motion.g>
  );
};
