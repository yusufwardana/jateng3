import { useMapStore } from '../store';
import { useStore } from 'zustand';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
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
  Database,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { parseSVG } from '../lib/svg-parser';
import { cn } from '../lib/utils';
import React, { useEffect, useState } from 'react';
import { signInWithEmail, signOut } from '../lib/supabase';

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
    lastSaved,
    user,
    selectedKecamatanIds,
    setSelectedKecamatan
  } = useMapStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) throw error;
      setShowLoginForm(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      alert(error.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

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
    <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-sm z-10 gap-4 overflow-x-auto flex-nowrap">
      <div className="flex items-center justify-start gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 mr-6">
          <div className="p-2 bg-purple-800 rounded-lg text-white">
            <MapIcon size={20} />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-purple-900">Dashboard Mapping Wilayah Jateng 3</h1>
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

        <Button variant="ghost" size="sm" className="gap-2 text-slate-600 px-3" onClick={() => { setZoom(1); setPan({ x: 300, y: 100 }); }}>
          <Maximize size={14} />
          <span>Reset View</span>
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

        {selectedKecamatanIds.length > 0 && user && (
          <>
            <Separator orientation="vertical" className="h-8 mx-2" />
            <Button 
              variant="destructive" 
              size="sm" 
              className="gap-2 h-8 px-3"
              onClick={() => {
                if (confirm(`Delete ${selectedKecamatanIds.length} selected kecamatans?`)) {
                  selectedKecamatanIds.forEach(id => deleteKecamatan(id));
                  setSelectedKecamatan(null);
                }
              }}
            >
              <Trash2 size={14} />
              <span>Delete ({selectedKecamatanIds.length})</span>
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 flex-shrink-0">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-slate-900">{user.email}</span>
              <span className="text-[10px] text-slate-500">Admin Mode</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </Button>
            <Separator orientation="vertical" className="h-8 mx-2" />
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 h-8 px-3" 
              onClick={saveData}
              disabled={isSaving}
            >
              <CloudUpload size={14} className={cn(isSaving && "animate-pulse")} />
              <span>{isSaving ? 'Saving...' : 'Save Cloud'}</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {showLoginForm ? (
              <form onSubmit={handleLogin} className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <Input 
                  type="email" 
                  placeholder="Email" 
                  className="h-8 w-40 text-xs" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="h-8 w-40 text-xs" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" size="sm" className="h-8 px-3" disabled={isLoggingIn}>
                  {isLoggingIn ? '...' : 'Login'}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 px-3" onClick={() => setShowLoginForm(false)}>
                  Cancel
                </Button>
              </form>
            ) : (
              <Button variant="outline" size="sm" className="gap-2 h-8 px-3" onClick={() => setShowLoginForm(true)}>
                <LogIn size={14} />
                <span>Admin Login</span>
              </Button>
            )}
          </div>
        )}

        <Separator orientation="vertical" className="h-8 mx-2" />

        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3" onClick={clearAll} title="Clear All">
          <Trash2 size={16} className="mr-2" />
          <span>Clear All</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("gap-2 px-3", isAllLocked ? "text-amber-600 hover:bg-amber-50" : "text-slate-600")}
          onClick={() => setAllLocked(!isAllLocked)}
          title={isAllLocked ? 'Locked' : 'Unlocked'}
        >
          {isAllLocked ? <Lock size={16} /> : <Unlock size={16} />}
          <span>{isAllLocked ? 'Locked' : 'Unlocked'}</span>
        </Button>

        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <Button variant="outline" size="sm" className={cn("gap-2 px-3 h-8", isDragActive && "border-orange-500 bg-orange-50")} title="Upload SVG">
            <Upload size={16} />
            <span>Upload SVG</span>
          </Button>
        </div>
        
        <Button variant="default" size="sm" className="gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 h-8" onClick={exportMap} title="Export JSON">
          <Download size={16} />
          <span>Export JSON</span>
        </Button>

        <Separator orientation="vertical" className="h-8 mx-2" />

        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border",
            user ? "bg-green-50 text-green-700 border-green-200" : "bg-purple-50 text-purple-700 border-purple-200"
          )}>
            <Database size={12} />
            <span>{user ? 'Supabase Cloud' : 'Browser Local'}</span>
          </div>

          {lastSaved && (
            <span className="text-[10px] text-slate-400 italic">
              {user ? 'Cloud saved' : 'Auto-saved'} {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 h-8 text-slate-500 px-3" 
              onClick={downloadBackup}
              title="Download Backup to Computer"
            >
              <DownloadIcon size={14} />
              <span>Backup (.json)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
