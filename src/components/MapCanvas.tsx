import { useMapStore } from '../store';
import { MapKecamatan } from './MapKecamatan';

export const MapCanvas = () => {
  const { kecamatans, zoom, pan, setPan, setSelectedKecamatan } = useMapStore();

  return (
    <div 
      className="relative w-full h-full bg-slate-50 overflow-hidden border border-slate-200 rounded-xl shadow-inner"
      onClick={() => setSelectedKecamatan(null)}
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
        
        {kecamatans.map((kecamatan) => (
          <MapKecamatan key={kecamatan.id} kecamatan={kecamatan} />
        ))}
      </svg>
    </div>
  );
};
