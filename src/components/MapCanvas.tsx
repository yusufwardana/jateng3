import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../store';
import { MapKecamatan } from './MapKecamatan';

export const MapCanvas = () => {
  const { kecamatans, areas, clusters, regions, zoom, setZoom, pan, setPan, setSelectedKecamatan, setSelectedKecamatanIds, selectedKecamatanIds } = useMapStore();
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const CANVAS_SIZE = 5000;

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

  // Initial centering
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Center the scroll position
    container.scrollLeft = (CANVAS_SIZE * zoom - container.clientWidth) / 2;
    container.scrollTop = (CANVAS_SIZE * zoom - container.clientHeight) / 2;
  }, []);

  // Sync pan state with scroll position for other components to use if needed
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setPan({ x: container.scrollLeft, y: container.scrollTop });
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [setPan]);

  // Handle Reset View
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // If pan is reset to a specific value in the store, sync the scroll
    if (pan.x === 300 && pan.y === 100) {
      container.scrollLeft = (CANVAS_SIZE * zoom - container.clientWidth) / 2;
      container.scrollTop = (CANVAS_SIZE * zoom - container.clientHeight) / 2;
    }
  }, [pan.x, pan.y, zoom]);

  const getSvgPoint = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) { 
      e.preventDefault();
      setIsPanning(true);
      setSelectedKecamatan(null);
    } else if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg' || (e.target as Element).tagName === 'rect') {
      if (!e.shiftKey) {
        setSelectedKecamatan(null);
      }
      const pt = getSvgPoint(e.clientX, e.clientY);
      setSelectionBox({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning && containerRef.current) {
      containerRef.current.scrollLeft -= e.movementX;
      containerRef.current.scrollTop -= e.movementY;
    } else if (selectionBox) {
      const pt = getSvgPoint(e.clientX, e.clientY);
      setSelectionBox({ ...selectionBox, currentX: pt.x, currentY: pt.y });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    
    if (selectionBox) {
      const minX = Math.min(selectionBox.startX, selectionBox.currentX);
      const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
      const minY = Math.min(selectionBox.startY, selectionBox.currentY);
      const maxY = Math.max(selectionBox.startY, selectionBox.currentY);

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
      ref={containerRef}
      className={`relative w-full h-full bg-slate-100 overflow-auto border border-slate-200 rounded-xl shadow-inner ${isPanning ? 'cursor-grabbing' : selectionBox ? 'cursor-crosshair' : 'cursor-default'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        className="flex items-center justify-center"
        style={{ 
          width: `${CANVAS_SIZE * zoom}px`, 
          height: `${CANVAS_SIZE * zoom}px`,
          minWidth: '100%',
          minHeight: '100%'
        }}
      >
        <svg
          ref={svgRef}
          className="bg-white shadow-2xl"
          width={CANVAS_SIZE * zoom}
          height={CANVAS_SIZE * zoom}
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        >
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <g transform={`translate(${CANVAS_SIZE/2 - 500}, ${CANVAS_SIZE/2 - 500})`}>
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
                strokeWidth={1}
                strokeDasharray="4 4"
                pointerEvents="none"
              />
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};
