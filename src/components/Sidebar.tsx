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
  LogOut,
  LogIn,
  User as UserIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { signInWithGoogle } from '../lib/supabase';

export const Sidebar = () => {
  const { 
    regions, 
    clusters, 
    areas, 
    kecamatans,
    selectedKecamatanId,
    selectedAreaId, 
    selectedClusterId,
    selectedRegionId,
    setSelectedKecamatan,
    setSelectedArea,
    setSelectedCluster,
    setSelectedRegion,
    updateKecamatan,
    updateArea,
    updateCluster,
    deleteKecamatan,
    deleteArea,
    deleteCluster,
    addCluster,
    addArea,
    user,
    signOut
  } = useMapStore();

  const handleLogin = async () => {
    try {
      const url = await signInWithGoogle();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const selectedKecamatan = kecamatans.find(k => k.id === selectedKecamatanId);
  const selectedArea = areas.find(a => a.id === selectedAreaId);
  const selectedCluster = clusters.find(c => c.id === selectedClusterId);

  return (
    <div className="w-80 h-full border-l border-slate-200 bg-white flex flex-col">
      <Tabs defaultValue="hierarchy" className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <FolderTree size={14} />
              Hierarchy
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Settings2 size={14} />
              Properties
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="hierarchy" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-6">
              {regions.map(region => (
                <div key={region.id} className="space-y-2">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <ChevronRight size={16} className="text-slate-400" />
                      {region.name}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => addCluster({
                        id: Math.random().toString(36).substr(2, 9),
                        name: 'New Cluster',
                        color: '#3b82f6',
                        regionId: region.id
                      })}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  
                  <div className="pl-4 space-y-2 border-l border-slate-100 ml-2">
                    {clusters.filter(c => c.regionId === region.id).map(cluster => (
                      <div key={cluster.id} className="space-y-1">
                        <div 
                          className={cn(
                            "flex items-center justify-between p-1.5 rounded-md cursor-pointer group transition-colors",
                            selectedClusterId === cluster.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                          )}
                          onClick={() => setSelectedCluster(cluster.id)}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cluster.color }} />
                            {cluster.name}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 text-slate-400 hover:text-blue-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                addArea({
                                  id: Math.random().toString(36).substr(2, 9),
                                  name: 'New Area',
                                  color: cluster.color,
                                  clusterId: cluster.id
                                });
                              }}
                            >
                              <Plus size={12} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 text-slate-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCluster(cluster.id);
                              }}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>

                        <div className="pl-4 space-y-1 border-l border-slate-50 ml-1">
                          {areas.filter(a => a.clusterId === cluster.id).map(area => (
                            <div key={area.id} className="space-y-1">
                              <div 
                                className={cn(
                                  "flex items-center justify-between p-1.5 rounded-md cursor-pointer group transition-colors text-xs",
                                  selectedAreaId === area.id ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600 hover:bg-slate-50"
                                )}
                                onClick={() => {
                                  setSelectedArea(area.id);
                                  setSelectedCluster(cluster.id);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <Layers size={12} className="text-slate-400" />
                                  {area.name}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-4 w-4 opacity-0 group-hover:opacity-100 hover:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteArea(area.id);
                                  }}
                                >
                                  <Trash2 size={10} />
                                </Button>
                              </div>

                              <div className="pl-4 space-y-1">
                                {kecamatans.filter(k => k.areaId === area.id).map(kecamatan => (
                                  <div 
                                    key={kecamatan.id}
                                    className={cn(
                                      "flex items-center justify-between p-1 rounded-md cursor-pointer text-[10px] transition-colors",
                                      selectedKecamatanId === kecamatan.id ? "bg-slate-200 text-slate-900 font-bold" : "text-slate-400 hover:bg-slate-50"
                                    )}
                                    onClick={() => {
                                      setSelectedKecamatan(kecamatan.id);
                                      setSelectedArea(area.id);
                                      setSelectedCluster(cluster.id);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <MapPin size={10} />
                                      {kecamatan.name}
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-3 w-3 opacity-0 group-hover:opacity-100 hover:text-red-500"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteKecamatan(kecamatan.id);
                                      }}
                                    >
                                      <Trash2 size={8} />
                                    </Button>
                                  </div>
                                ))}
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

        <TabsContent value="properties" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full p-4">
            {!selectedKecamatan && !selectedArea && !selectedCluster ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                Select an item to edit properties
              </div>
            ) : (
              <div className="space-y-6">
                {selectedKecamatan && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MapPin size={16} />
                      Kecamatan Properties
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="kec-name">Name</Label>
                      <Input 
                        id="kec-name" 
                        value={selectedKecamatan.name} 
                        onChange={(e) => updateKecamatan(selectedKecamatan.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kec-label">Label</Label>
                      <Input 
                        id="kec-label" 
                        value={selectedKecamatan.label} 
                        onChange={(e) => updateKecamatan(selectedKecamatan.id, { label: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kec-color">Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="kec-color" 
                          type="color" 
                          className="w-12 p-1 h-10"
                          value={selectedKecamatan.color} 
                          onChange={(e) => updateKecamatan(selectedKecamatan.id, { color: e.target.value })}
                        />
                        <Input 
                          value={selectedKecamatan.color} 
                          onChange={(e) => updateKecamatan(selectedKecamatan.id, { color: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between">
                        <Label>Size (Scale)</Label>
                        <span className="text-xs font-mono text-slate-500">{(selectedKecamatan.scale || 1).toFixed(2)}x</span>
                      </div>
                      <Slider 
                        value={[selectedKecamatan.scale || 1]} 
                        min={0.1} 
                        max={3} 
                        step={0.05}
                        onValueChange={(vals: number[]) => updateKecamatan(selectedKecamatan.id, { scale: vals[0] })}
                      />
                    </div>
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
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon size={16} className="text-blue-600" />
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-slate-900 truncate">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-red-500"
              onClick={() => signOut()}
            >
              <LogOut size={16} />
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full flex items-center gap-2 justify-center bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
            onClick={handleLogin}
          >
            <LogIn size={16} />
            Sign in with Google
          </Button>
        )}
      </div>
    </div>
  );
};
