import { useMapStore } from '../store';
import { useStore } from 'zustand';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { 
  Plus, 
  Minus, 
  Upload, 
  Download, 
  Undo2, 
  Redo2,
  Maximize,
  Map as MapIcon,
  Trash2,
  CloudUpload,
  CloudDownload,
  Lock,
  Unlock,
  Download as DownloadIcon,
  Database
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { parseSVG } from '../lib/svg-parser';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

export const Toolbar = () => {
  const { 
    zoom, 
    setZoom, 
    addKecamatan, 
    selectedAreaId,
    kecamatans,
    areas,
    clusters,
    regions,
    deleteKecamatan,
    setPan,
    saveData,
    loadData,
    isSaving,
    isLoading,
    isAllLocked,
    setAllLocked,
    lastSaved
  } = useMapStore();

  const [storageType, setStorageType] = useState<'Local' | 'Cloud' | 'Ephemeral'>('Local');

  useEffect(() => {
    // Check storage type from server
    fetch('/api/map-data')
      .then(res => {
        const type = res.headers.get('x-storage-type');
        if (type === 'cloud') setStorageType('Cloud');
        else if (type === 'local-ephemeral') setStorageType('Ephemeral');
        else setStorageType('Local');
      });
  }, []);

  const downloadBackup = () => {
    const data = { regions, clusters, areas, kecamatans };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { undo, redo, pastStates, futureStates } = useStore(useMapStore.temporal, (state) => state);

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const svgString = reader.result as string;
        const parsedPaths = parseSVG(svgString);
        
        parsedPaths.forEach((p, index) => {
          addKecamatan({
            id: Math.random().toString(36).substr(2, 9),
            name: `${file.name.replace('.svg', '')} ${index + 1}`,
            path: p.path,
            color: areas.find(a => a.id === selectedAreaId)?.color || '#94a3b8',
            label: '',
            position: { x: 100 + (index * 20), y: 100 + (index * 20) },
            scale: 1,
            areaId: selectedAreaId || 'default-area',
            viewBox: p.viewBox
          });
        });
      };
      reader.readAsText(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/svg+xml': ['.svg'] }
  } as any);

  const exportMap = () => {
    const data = {
      regions,
      clusters,
      areas,
      kecamatans
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map-state.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    kecamatans.forEach(k => deleteKecamatan(k.id));
  };

  return (
    <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 mr-6">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <MapIcon size={20} />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-900">Atlas Mapper</h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
            <Minus size={16} />
          </Button>
          <div className="w-12 text-center text-xs font-medium text-slate-600">
            {Math.round(zoom * 100)}%
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(5, zoom + 0.1))}>
            <Plus size={16} />
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="gap-2 text-slate-600" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
          <Maximize size={14} />
          Reset View
        </Button>

        <Separator orientation="vertical" className="h-8 mx-2" />

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => undo()} 
            disabled={pastStates.length === 0}
            title="Undo"
          >
            <Undo2 size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => redo()} 
            disabled={futureStates.length === 0}
            title="Redo"
          >
            <Redo2 size={16} />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearAll}>
          <Trash2 size={16} className="mr-2" />
          Clear All
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("gap-2", isAllLocked ? "text-amber-600 hover:bg-amber-50" : "text-slate-600")}
          onClick={() => setAllLocked(!isAllLocked)}
        >
          {isAllLocked ? <Lock size={16} /> : <Unlock size={16} />}
          {isAllLocked ? 'Locked' : 'Unlocked'}
        </Button>

        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <Button variant="outline" className={cn("gap-2", isDragActive && "border-blue-500 bg-blue-50")}>
            <Upload size={16} />
            Upload SVG
          </Button>
        </div>
        
        <Button variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={exportMap}>
          <Download size={16} />
          Export JSON
        </Button>

        <Separator orientation="vertical" className="h-8 mx-2" />

        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border",
            storageType === 'Cloud' 
              ? "bg-green-50 text-green-700 border-green-200" 
              : storageType === 'Ephemeral'
              ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
              : "bg-amber-50 text-amber-700 border-amber-200"
          )}>
            <Database size={12} />
            {storageType === 'Cloud' 
              ? 'Vercel Cloud (Persistent)' 
              : storageType === 'Ephemeral'
              ? 'Vercel Local (WILL BE LOST - REDEPLOY NOW)'
              : 'Local File (Temporary)'}
          </div>

          {lastSaved && (
            <span className="text-[10px] text-slate-400 italic">
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 h-8" 
              onClick={saveData}
              disabled={isSaving}
            >
              <CloudUpload size={14} className={cn(isSaving && "animate-pulse")} />
              Save
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 h-8 text-slate-500" 
              onClick={downloadBackup}
              title="Download Backup to Computer"
            >
              <DownloadIcon size={14} />
              Backup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
