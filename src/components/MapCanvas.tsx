import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../store';
import { MapKecamatan } from './MapKecamatan';

export const MapCanvas = () => {
  const { kecamatans, areas, clusters, regions, zoom, setZoom, pan, setPan, setSelectedKecamatan } = useMapStore();
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const visibleKecamatans = kecamatans.filter((kec) => {
    if (kec.isVisible === false) return false;
    const area = areas.find(a => a.id === kec.areaId);
    if (!area || area.isVisible === false) return false;
    const cluster = clusters.find(c => c.id === area.clusterId);
    if (!cluster || cluster.isVisible === false) return false;
    const region = regions.find(r => r.id === cluster.regionId);
    if (!region || region.isVisible === false) return false;
    return true;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Zoom
      if (e.ctrlKey || !e.shiftKey) {
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
        setZoom(newZoom);
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [zoom, setZoom]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) { // Middle click, right click, or Alt+Left click to pan
      e.preventDefault();
      setIsPanning(true);
      setSelectedKecamatan(null);
    } else if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg') {
      setSelectedKecamatan(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({
        x: pan.x + e.movementX / zoom,
        y: pan.y + e.movementY / zoom
      });
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  return (
    <div 
      ref={canvasRef}
      className={`relative w-full h-full bg-slate-50 overflow-hidden border border-slate-200 rounded-xl shadow-inner ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 1000"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center',
        }}
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {visibleKecamatans.map((kecamatan) => (
          <MapKecamatan key={kecamatan.id} kecamatan={kecamatan} />
        ))}
      </svg>
    </div>
  );
};
