import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../store';
import { MapKecamatan } from './MapKecamatan';

export const MapCanvas = () => {
  const { kecamatans, areas, clusters, regions, zoom, setZoom, pan, setPan, setSelectedKecamatan, setSelectedKecamatanIds, selectedKecamatanIds } = useMapStore();
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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

  const getSvgPoint = (e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) { // Middle click, right click, or Alt+Left click to pan
      e.preventDefault();
      setIsPanning(true);
      setSelectedKecamatan(null);
    } else if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg' || (e.target as Element).tagName === 'rect') {
      // Start selection box
      if (!e.shiftKey) {
        setSelectedKecamatan(null);
      }
      const pt = getSvgPoint(e);
      setSelectionBox({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({
        x: pan.x + e.movementX / zoom,
        y: pan.y + e.movementY / zoom
      });
    } else if (selectionBox) {
      const pt = getSvgPoint(e);
      setSelectionBox({ ...selectionBox, currentX: pt.x, currentY: pt.y });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    
    if (selectionBox) {
      // Calculate selected items
      const minX = Math.min(selectionBox.startX, selectionBox.currentX);
      const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
      const minY = Math.min(selectionBox.startY, selectionBox.currentY);
      const maxY = Math.max(selectionBox.startY, selectionBox.currentY);

      // Only select if the box is large enough (not just a click)
      if (maxX - minX > 5 || maxY - minY > 5) {
        const svg = svgRef.current;
        if (svg) {
          const ctm = svg.getScreenCTM();
          if (ctm) {
            const inverseCtm = ctm.inverse();
            const newlySelectedIds: string[] = [];
            const elements = svg.querySelectorAll('.map-kecamatan');
            
            elements.forEach((el) => {
              const rect = el.getBoundingClientRect();
              const pt1 = svg.createSVGPoint(); pt1.x = rect.left; pt1.y = rect.top;
              const pt2 = svg.createSVGPoint(); pt2.x = rect.right; pt2.y = rect.bottom;
              const svgPt1 = pt1.matrixTransform(inverseCtm);
              const svgPt2 = pt2.matrixTransform(inverseCtm);
              
              const elMinX = Math.min(svgPt1.x, svgPt2.x);
              const elMaxX = Math.max(svgPt1.x, svgPt2.x);
              const elMinY = Math.min(svgPt1.y, svgPt2.y);
              const elMaxY = Math.max(svgPt1.y, svgPt2.y);
              
              // Check intersection with selection box
              if (elMinX < maxX && elMaxX > minX && elMinY < maxY && elMaxY > minY) {
                const id = el.getAttribute('data-id');
                if (id) newlySelectedIds.push(id);
              }
            });

            if (e.shiftKey) {
              const combined = new Set([...selectedKecamatanIds, ...newlySelectedIds]);
              setSelectedKecamatanIds(Array.from(combined));
            } else {
              setSelectedKecamatanIds(newlySelectedIds);
            }
          }
        }
      }
      
      setSelectionBox(null);
    }
  };

  return (
    <div 
      ref={canvasRef}
      className={`relative w-full h-full bg-slate-50 overflow-auto border border-slate-200 rounded-xl shadow-inner ${isPanning ? 'cursor-grabbing' : selectionBox ? 'cursor-crosshair' : 'cursor-default'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        className="w-[2000px] h-[2000px] md:w-full md:h-full"
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

        {selectionBox && (
          <rect
            x={Math.min(selectionBox.startX, selectionBox.currentX)}
            y={Math.min(selectionBox.startY, selectionBox.currentY)}
            width={Math.abs(selectionBox.currentX - selectionBox.startX)}
            height={Math.abs(selectionBox.currentY - selectionBox.startY)}
            fill="rgba(249, 115, 22, 0.1)"
            stroke="#f97316"
            strokeWidth={1 / zoom}
            strokeDasharray="4 4"
            pointerEvents="none"
          />
        )}
      </svg>
    </div>
  );
};
