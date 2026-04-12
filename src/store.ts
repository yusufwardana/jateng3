import { create } from 'zustand';
import { temporal } from 'zundo';
import { MapState, Region, Cluster, Area, Kecamatan } from './types';

interface MapStore extends MapState {
  addRegion: (region: Region) => void;
  addCluster: (cluster: Cluster) => void;
  addArea: (area: Area) => void;
  addKecamatan: (kecamatan: Kecamatan) => void;
  updateKecamatan: (id: string, updates: Partial<Kecamatan>) => void;
  updateArea: (id: string, updates: Partial<Area>) => void;
  updateCluster: (id: string, updates: Partial<Cluster>) => void;
  setSelectedKecamatan: (id: string | null) => void;
  setSelectedArea: (id: string | null) => void;
  setSelectedCluster: (id: string | null) => void;
  setSelectedRegion: (id: string | null) => void;
  setAllLocked: (locked: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  deleteKecamatan: (id: string) => void;
  deleteArea: (id: string) => void;
  deleteCluster: (id: string) => void;
  deleteRegion: (id: string) => void;
  
  // Persistence Actions
  saveData: () => Promise<void>;
  loadData: () => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
}

export const useMapStore = create<MapStore>()(
  temporal(
    (set, get) => ({
      regions: [{ id: 'jateng-3', name: 'JATENG 3' }],
      clusters: [{ id: 'default-cluster', name: 'Main Cluster', color: '#3b82f6', regionId: 'jateng-3' }],
      areas: [{ id: 'default-area', name: 'Main Area', color: '#3b82f6', clusterId: 'default-cluster' }],
      kecamatans: [],
      selectedKecamatanId: null,
      selectedAreaId: 'default-area',
      selectedClusterId: 'default-cluster',
      selectedRegionId: 'jateng-3',
      isAllLocked: false,
      zoom: 1,
      pan: { x: 0, y: 0 },
      isSaving: false,
      isLoading: false,
      lastSaved: null,

      addRegion: (region) => set((state) => ({ regions: [...state.regions, region] })),
      addCluster: (cluster) => set((state) => ({ clusters: [...state.clusters, cluster] })),
      addArea: (area) => set((state) => ({ areas: [...state.areas, area] })),
      addKecamatan: (kecamatan) => set((state) => ({ kecamatans: [...state.kecamatans, kecamatan] })),
      
      updateKecamatan: (id, updates) => set((state) => ({
        kecamatans: state.kecamatans.map((k) => (k.id === id ? { ...k, ...updates } : k))
      })),

      updateArea: (id, updates) => set((state) => ({
        areas: state.areas.map((a) => (a.id === id ? { ...a, ...updates } : a))
      })),

      updateCluster: (id, updates) => set((state) => ({
        clusters: state.clusters.map((c) => (c.id === id ? { ...c, ...updates } : c))
      })),

      setSelectedKecamatan: (id) => set({ selectedKecamatanId: id }),
      setSelectedArea: (id) => set({ selectedAreaId: id }),
      setSelectedCluster: (id) => set({ selectedClusterId: id }),
      setSelectedRegion: (id) => set({ selectedRegionId: id }),
      setAllLocked: (locked) => set({ isAllLocked: locked }),
      setZoom: (zoom) => set({ zoom }),
      setPan: (pan) => set({ pan }),

      deleteKecamatan: (id) => set((state) => ({
        kecamatans: state.kecamatans.filter((k) => k.id !== id),
        selectedKecamatanId: state.selectedKecamatanId === id ? null : state.selectedKecamatanId
      })),

      deleteArea: (id) => set((state) => ({
        areas: state.areas.filter((a) => a.id !== id),
        kecamatans: state.kecamatans.filter((k) => k.areaId !== id),
        selectedAreaId: state.selectedAreaId === id ? null : state.selectedAreaId
      })),

      deleteCluster: (id) => set((state) => ({
        clusters: state.clusters.filter((c) => c.id !== id),
        areas: state.areas.filter((a) => a.clusterId !== id),
        kecamatans: state.kecamatans.filter((k) => {
          const area = state.areas.find(a => a.id === k.areaId);
          return area?.clusterId !== id;
        }),
        selectedClusterId: state.selectedClusterId === id ? null : state.selectedClusterId
      })),

      deleteRegion: (id) => set((state) => ({
        regions: state.regions.filter((r) => r.id !== id),
        clusters: state.clusters.filter((c) => c.regionId !== id),
        areas: state.areas.filter((a) => {
          const cluster = state.clusters.find(c => c.id === a.clusterId);
          return cluster?.regionId !== id;
        }),
        kecamatans: state.kecamatans.filter((k) => {
          const area = state.areas.find(a => a.id === k.areaId);
          const cluster = state.clusters.find(c => c.id === area?.clusterId);
          return cluster?.regionId !== id;
        }),
        selectedRegionId: state.selectedRegionId === id ? null : state.selectedRegionId
      })),

      saveData: async () => {
        set({ isSaving: true });
        try {
          const { regions, clusters, areas, kecamatans } = get();
          const response = await fetch("/api/map-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ regions, clusters, areas, kecamatans }),
          });
          
          if (!response.ok) throw new Error('Failed to save data');
          set({ lastSaved: new Date() });
        } catch (error) {
          console.error('Error saving data:', error);
        } finally {
          set({ isSaving: false });
        }
      },

      loadData: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/map-data");
          if (!response.ok) throw new Error('Failed to load data');
          const data = await response.json();
          
          if (data) {
            set({ 
              regions: data.regions || [],
              clusters: data.clusters || [],
              areas: data.areas || [],
              kecamatans: data.kecamatans || []
            });
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      partialize: (state) => {
        const { zoom, pan, selectedKecamatanId, selectedAreaId, selectedClusterId, selectedRegionId, isSaving, isLoading, isAllLocked, lastSaved, ...rest } = state;
        return rest;
      },
    }
  )
);
