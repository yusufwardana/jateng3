import React, { useState } from 'react';
import { useMapStore } from '../store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { 
  Layers, 
  Settings2, 
  Plus, 
  Trash2, 
  ChevronRight, 
  MapPin,
  FolderTree,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Sidebar = () => {
  const { 
    regions, 
    clusters, 
    areas, 
    kecamatans,
    selectedKecamatanId,
    selectedKecamatanIds,
    selectedAreaId, 
    selectedClusterId,
    selectedRegionId,
    setSelectedKecamatan,
    toggleKecamatanSelection,
    setSelectedArea,
    setSelectedCluster,
    setSelectedRegion,
    updateKecamatan,
    updateArea,
    updateCluster,
    updateRegion,
    deleteKecamatan,
    deleteArea,
    deleteCluster,
    addCluster,
    addArea,
    user
  } = useMapStore();

  const [expandedRegions, setExpandedRegions] = useState<string[]>(regions.map(r => r.id));
  const [expandedClusters, setExpandedClusters] = useState<string[]>(clusters.map(c => c.id));
  const [searchQuery, setSearchQuery] = useState('');

  const toggleRegion = (id: string) => {
    setExpandedRegions(prev => prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]);
  };

  const toggleCluster = (id: string) => {
    setExpandedClusters(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

  const selectedKecamatan = kecamatans.find(k => k.id === selectedKecamatanId);
  const selectedArea = areas.find(a => a.id === selectedAreaId);
  const selectedCluster = clusters.find(c => c.id === selectedClusterId);

  return (
    <div className="w-80 h-full border-l border-slate-200 bg-white flex flex-col flex-shrink-0 overflow-hidden">
      <Tabs defaultValue="hierarchy" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4 flex-shrink-0 space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hierarchy" className="flex items-center gap-1 text-xs">
              <FolderTree size={12} />
              Hierarchy
            </TabsTrigger>
            <TabsTrigger value="layers" className="flex items-center gap-1 text-xs">
              <Layers size={12} />
              Layers
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-1 text-xs">
              <Settings2 size={12} />
              Props
            </TabsTrigger>
          </TabsList>
          <Input 
            placeholder="Search kecamatan..." 
            className="h-8 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <TabsContent value="hierarchy" className="flex-1 min-h-0 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {regions.map(region => {
                const clustersInRegion = clusters.filter(c => c.regionId === region.id);
                const areasInRegion = areas.filter(a => clustersInRegion.some(c => c.id === a.clusterId));
                const kecamatansInRegion = kecamatans.filter(k => areasInRegion.some(a => a.id === k.areaId));
                
                const filteredKecamatansInRegion = kecamatansInRegion.filter(k => 
                  k.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  k.label.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (searchQuery && filteredKecamatansInRegion.length === 0) return null;

                return (
                  <div key={region.id} className="space-y-2">
                    <div className="flex items-center justify-between group">
                      <button 
                        onClick={() => toggleRegion(region.id)}
                        className="flex items-center gap-2 font-semibold text-slate-900 hover:text-purple-700 transition-colors"
                      >
                        <ChevronRight 
                          size={16} 
                          className={cn("text-slate-400 transition-transform duration-200", (expandedRegions.includes(region.id) || searchQuery) && "rotate-90")} 
                        />
                        {region.name}
                      </button>
                      {user && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => addCluster({
                            id: Math.random().toString(36).substr(2, 9),
                            name: 'New Cluster',
                            color: '#f97316',
                            regionId: region.id
                          })}
                        >
                          <Plus size={14} />
                        </Button>
                      )}
                    </div>
                    
                    {(expandedRegions.includes(region.id) || searchQuery) && (
                      <div className="pl-4 space-y-4 border-l border-slate-100 ml-2">
                        {clustersInRegion.map(cluster => {
                          const areasInCluster = areas.filter(a => a.clusterId === cluster.id);
                          const kecamatansInCluster = kecamatans.filter(k => areasInCluster.some(a => a.id === k.areaId));
                          const filteredKecamatansInCluster = kecamatansInCluster.filter(k => 
                            k.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            k.label.toLowerCase().includes(searchQuery.toLowerCase())
                          );

                          if (searchQuery && filteredKecamatansInCluster.length === 0) return null;

                          return (
                            <div key={cluster.id} className="space-y-2">
                              <div className="flex items-center justify-between group">
                                <button 
                                  onClick={() => toggleCluster(cluster.id)}
                                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-purple-600 transition-colors"
                                >
                                  <ChevronRight 
                                    size={14} 
                                    className={cn("text-slate-400 transition-transform duration-200", (expandedClusters.includes(cluster.id) || searchQuery) && "rotate-90")} 
                                  />
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cluster.color }} />
                                  {cluster.name}
                                </button>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                  {user && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6"
                                      onClick={() => addArea({
                                        id: Math.random().toString(36).substr(2, 9),
                                        name: 'New Area',
                                        color: cluster.color,
                                        clusterId: cluster.id
                                      })}
                                    >
                                      <Plus size={14} />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => setSelectedCluster(cluster.id)}
                                  >
                                    <Settings2 size={14} />
                                  </Button>
                                </div>
                              </div>

                              {(expandedClusters.includes(cluster.id) || searchQuery) && (
                                <div className="pl-4 space-y-1 border-l border-slate-100 ml-2">
                                  {areasInCluster.map(area => {
                                    const kecamatansInArea = kecamatans.filter(k => k.areaId === area.id);
                                    const filteredKecamatansInArea = kecamatansInArea.filter(k => 
                                      k.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      k.label.toLowerCase().includes(searchQuery.toLowerCase())
                                    );

                                    if (searchQuery && filteredKecamatansInArea.length === 0) return null;

                                    return (
                                      <div key={area.id} className="space-y-1">
                                        <div className="flex items-center justify-between group">
                                          <button 
                                            className={cn(
                                              "flex items-center gap-2 text-xs py-1 px-2 rounded-md w-full text-left transition-colors",
                                              selectedAreaId === area.id ? "bg-purple-50 text-purple-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                                            )}
                                            onClick={() => setSelectedArea(area.id)}
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: area.color }} />
                                            {area.name}
                                          </button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                            onClick={() => setSelectedArea(area.id)}
                                          >
                                            <Settings2 size={12} />
                                          </Button>
                                        </div>
                                        
                                        {(selectedAreaId === area.id || searchQuery) && (
                                          <div className="pl-4 space-y-0.5 mt-1">
                                            {filteredKecamatansInArea.map(kecamatan => (
                                              <div key={kecamatan.id} className="flex items-center justify-between group">
                                                <button
                                                  className={cn(
                                                    "flex items-center gap-2 text-[10px] py-1 px-2 rounded-md w-full text-left transition-colors",
                                                    selectedKecamatanIds.includes(kecamatan.id) ? "bg-orange-50 text-orange-700 font-medium" : "text-slate-500 hover:bg-slate-50"
                                                  )}
                                                  onClick={() => toggleKecamatanSelection(kecamatan.id, false)}
                                                >
                                                  <MapPin size={10} />
                                                  {kecamatan.name}
                                                </button>
                                                {user && (
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-5 w-5 text-slate-300 hover:text-red-500"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (confirm(`Delete kecamatan "${kecamatan.name}"?`)) {
                                                        deleteKecamatan(kecamatan.id);
                                                      }
                                                    }}
                                                  >
                                                    <Trash2 size={12} />
                                                  </Button>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="layers" className="flex-1 min-h-0 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => {
                  regions.forEach(r => updateRegion(r.id, { isVisible: true }));
                  clusters.forEach(c => updateCluster(c.id, { isVisible: true }));
                  areas.forEach(a => updateArea(a.id, { isVisible: true }));
                }}>Show All</Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => {
                  regions.forEach(r => updateRegion(r.id, { isVisible: false }));
                  clusters.forEach(c => updateCluster(c.id, { isVisible: false }));
                  areas.forEach(a => updateArea(a.id, { isVisible: false }));
                }}>Hide All</Button>
              </div>
              {regions.map(region => (
                <div key={region.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div 
                      className={cn(
                        "flex items-center gap-2 font-semibold cursor-pointer",
                        selectedRegionId === region.id ? "text-purple-800" : "text-slate-900"
                      )}
                      onClick={() => setSelectedRegion(region.id)}
                    >
                      <ChevronRight size={16} className="text-slate-400" />
                      {region.name}
                    </div>
                    <div className="flex items-center gap-1">
                      {selectedRegionId === region.id && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                          onClick={() => {
                            regions.forEach(r => updateRegion(r.id, { isVisible: r.id === region.id }));
                          }}
                        >
                          Show Only
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => updateRegion(region.id, { isVisible: region.isVisible === false ? true : false })}
                      >
                        {region.isVisible === false ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-600" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pl-4 space-y-2 border-l border-slate-100 ml-2">
                    {clusters.filter(c => c.regionId === region.id).map(cluster => (
                      <div key={cluster.id} className="space-y-1">
                        <div className="flex items-center justify-between p-1.5 rounded-md">
                          <div 
                            className={cn(
                              "flex items-center gap-2 text-sm font-medium cursor-pointer",
                              selectedClusterId === cluster.id ? "text-purple-800" : "text-slate-700"
                            )}
                            onClick={() => setSelectedCluster(cluster.id)}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cluster.color }} />
                            {cluster.name}
                          </div>
                          <div className="flex items-center gap-1">
                            {selectedClusterId === cluster.id && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                                onClick={() => {
                                  clusters.forEach(c => updateCluster(c.id, { isVisible: c.id === cluster.id }));
                                }}
                              >
                                Show Only
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => updateCluster(cluster.id, { isVisible: cluster.isVisible === false ? true : false })}
                            >
                              {cluster.isVisible === false ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-600" />}
                            </Button>
                          </div>
                        </div>

                        <div className="pl-4 space-y-1 border-l border-slate-50 ml-1">
                          {areas.filter(a => a.clusterId === cluster.id).map(area => (
                            <div key={area.id} className="flex items-center justify-between p-1.5 rounded-md text-xs">
                              <div 
                                className={cn(
                                  "flex items-center gap-2 cursor-pointer",
                                  selectedAreaId === area.id ? "text-purple-800 font-medium" : "text-slate-600"
                                )}
                                onClick={() => setSelectedArea(area.id)}
                              >
                                <Layers size={12} className={selectedAreaId === area.id ? "text-purple-800" : "text-slate-400"} />
                                {area.name}
                              </div>
                              <div className="flex items-center gap-1">
                                {selectedAreaId === area.id && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-[10px] px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                                    onClick={() => {
                                      areas.forEach(a => updateArea(a.id, { isVisible: a.id === area.id }));
                                    }}
                                  >
                                    Show Only
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  onClick={() => updateArea(area.id, { isVisible: area.isVisible === false ? true : false })}
                                >
                                  {area.isVisible === false ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-600" />}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="properties" className="flex-1 min-h-0 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {!user ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic text-center px-4">
                  <Lock size={32} className="mb-4 opacity-20" />
                  Login as Admin to edit properties
                </div>
              ) : !selectedKecamatan && !selectedArea && !selectedCluster ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                  Select an item to edit properties
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedKecamatan && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <MapPin size={16} className="text-orange-500" />
                          Kecamatan
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn("h-8 gap-2", selectedKecamatan.isLocked ? "text-amber-600" : "text-slate-400")}
                          onClick={() => updateKecamatan(selectedKecamatan.id, { isLocked: !selectedKecamatan.isLocked })}
                        >
                          {selectedKecamatan.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                          <span className="text-xs">{selectedKecamatan.isLocked ? 'Locked' : 'Unlocked'}</span>
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                          <Label htmlFor="kec-name" className="text-xs text-slate-500">Name</Label>
                          <Input 
                            id="kec-name" 
                            className="h-9"
                            value={selectedKecamatan.name} 
                            onChange={(e) => updateKecamatan(selectedKecamatan.id, { name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label htmlFor="kec-label" className="text-xs text-slate-500">Label</Label>
                          <Input 
                            id="kec-label" 
                            className="h-9"
                            value={selectedKecamatan.label} 
                            onChange={(e) => updateKecamatan(selectedKecamatan.id, { label: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label htmlFor="kec-color" className="text-xs text-slate-500">Color</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="kec-color" 
                              type="color" 
                              className="w-12 p-1 h-9"
                              value={selectedKecamatan.color} 
                              onChange={(e) => updateKecamatan(selectedKecamatan.id, { color: e.target.value })}
                            />
                            <Input 
                              className="h-9 font-mono text-xs"
                              value={selectedKecamatan.color} 
                              onChange={(e) => updateKecamatan(selectedKecamatan.id, { color: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs text-slate-500">Size (Scale)</Label>
                          <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{(selectedKecamatan.scale || 1).toFixed(2)}x</span>
                        </div>
                        <Slider 
                          value={[selectedKecamatan.scale || 1]} 
                          min={0.1} 
                          max={3} 
                          step={0.05}
                          onValueChange={(vals: number[]) => updateKecamatan(selectedKecamatan.id, { scale: vals[0] })}
                        />
                      </div>
                      
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full gap-2 h-9"
                        onClick={() => {
                          if (selectedKecamatanIds.length > 1) {
                            if (confirm(`Delete ${selectedKecamatanIds.length} selected kecamatans?`)) {
                              selectedKecamatanIds.forEach(id => deleteKecamatan(id));
                              setSelectedKecamatan(null);
                            }
                          } else {
                            if (confirm(`Delete kecamatan "${selectedKecamatan.name}"?`)) {
                              deleteKecamatan(selectedKecamatan.id);
                              setSelectedKecamatan(null);
                            }
                          }
                        }}
                      >
                        <Trash2 size={14} />
                        {selectedKecamatanIds.length > 1 
                          ? `Delete ${selectedKecamatanIds.length} Items` 
                          : 'Delete Kecamatan'}
                      </Button>
                    </div>
                  )}

                  {selectedKecamatan && (selectedArea || selectedCluster) && <Separator />}

                  {selectedArea && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Layers size={16} />
                        Area Properties
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="area-name">Name</Label>
                        <Input 
                          id="area-name" 
                          value={selectedArea.name} 
                          onChange={(e) => updateArea(selectedArea.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area-color">Default Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="area-color" 
                            type="color" 
                            className="w-12 p-1 h-10"
                            value={selectedArea.color} 
                            onChange={(e) => updateArea(selectedArea.id, { color: e.target.value })}
                          />
                          <Input 
                            value={selectedArea.color} 
                            onChange={(e) => updateArea(selectedArea.id, { color: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => {
                          kecamatans.filter(k => k.areaId === selectedArea.id).forEach(k => {
                            updateKecamatan(k.id, { color: selectedArea.color });
                          });
                        }}
                      >
                        Apply color to all kecamatans
                      </Button>
                    </div>
                  )}

                  {selectedArea && selectedCluster && <Separator />}

                  {selectedCluster && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FolderTree size={16} />
                        Cluster Properties
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="cluster-name">Name</Label>
                        <Input 
                          id="cluster-name" 
                          value={selectedCluster.name} 
                          onChange={(e) => updateCluster(selectedCluster.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cluster-color">Default Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="cluster-color" 
                            type="color" 
                            className="w-12 p-1 h-10"
                            value={selectedCluster.color} 
                            onChange={(e) => updateCluster(selectedCluster.id, { color: e.target.value })}
                          />
                          <Input 
                            value={selectedCluster.color} 
                            onChange={(e) => updateCluster(selectedCluster.id, { color: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
