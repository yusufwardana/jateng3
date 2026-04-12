import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../store';
import { MapKecamatan } from './MapKecamatan';

export const MapCanvas = () => {
  const { kecamatans, areas, clusters, regions, zoom, setZoom, pan, setPan, setSelectedKecamatan, setSelectedKecamatanIds, selectedKecamatanIds } = useMapStore();
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

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
    const container = containerRef.current;
    if (!container) return;

    // Set initial pan to center the map roughly
    if (pan.x === 0 && pan.y === 0) {
      setPan({ x: 300, y: 100 });
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (e.ctrlKey || !e.shiftKey) {
        // Zoom
        const zoomSensitivity = 0.002;
        const delta = -e.deltaY * zoomSensitivity;
        const newZoom = Math.max(0.1, Math.min(10, zoom * (1 + delta)));
        
        if (newZoom !== zoom) {
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const svgX = (mouseX - pan.x) / zoom;
          const svgY = (mouseY - pan.y) / zoom;
          
          const newPanX = mouseX - (svgX * newZoom);
          const newPanY = mouseY - (svgY * newZoom);

          setZoom(newZoom);
          setPan({ x: newPanX, y: newPanY });
        }
      } else {
        // Pan with trackpad
        setPan({
          x: pan.x - e.deltaX,
          y: pan.y - e.deltaY
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, pan, setZoom, setPan]);

  const getSvgPoint = (clientX: number, clientY: number) => {
    if (!gRef.current || !svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = gRef.current.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey) || (e.button === 0 && e.shiftKey && e.ctrlKey)) { 
      e.preventDefault();
      setIsPanning(true);
      setSelectedKecamatan(null);
    } else if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg' || ((e.target as Element).tagName === 'rect' && (e.target as Element).id === 'bg-rect')) {
      if (!e.shiftKey) {
        setSelectedKecamatan(null);
      }
      const pt = getSvgPoint(e.clientX, e.clientY);
      setSelectionBox({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({
        x: pan.x + e.movementX,
        y: pan.y + e.movementY
      });
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
        const g = gRef.current;
        if (svg && g) {
          const ctm = g.getScreenCTM();
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
      className={`relative w-full h-full bg-slate-100 overflow-hidden border border-slate-200 rounded-xl shadow-inner ${isPanning ? 'cursor-grabbing' : selectionBox ? 'cursor-crosshair' : 'cursor-default'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
      >
        <defs>
          <pattern id="grid" width={50 * zoom} height={50 * zoom} patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x % (50 * zoom)}, ${pan.y % (50 * zoom)})`}>
            <path d={`M ${50 * zoom} 0 L 0 0 0 ${50 * zoom}`} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect id="bg-rect" width="100%" height="100%" fill="url(#grid)" />
        
        <g ref={gRef} transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
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
              strokeDasharray={`${4 / zoom} ${4 / zoom}`}
              pointerEvents="none"
            />
          )}
        </g>
      </svg>
    </div>
  );
};
