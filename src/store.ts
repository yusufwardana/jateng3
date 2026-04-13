import { create } from 'zustand';
import { temporal } from 'zundo';
import { MapState, Region, Cluster, Area, Kecamatan } from './types';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

interface MapStore extends MapState {
  user: User | null;
  setUser: (user: User | null) => void;
  addRegion: (region: Region) => void;
  addCluster: (cluster: Cluster) => void;
  addArea: (area: Area) => void;
  addKecamatan: (kecamatan: Kecamatan) => void;
  updateKecamatan: (id: string, updates: Partial<Kecamatan>) => void;
  updateArea: (id: string, updates: Partial<Area>) => void;
  updateCluster: (id: string, updates: Partial<Cluster>) => void;
  updateRegion: (id: string, updates: Partial<Region>) => void;
  setSelectedKecamatan: (id: string | null) => void;
  toggleKecamatanSelection: (id: string, multi: boolean) => void;
  setSelectedKecamatanIds: (ids: string[]) => void;
  moveSelectedKecamatans: (dx: number, dy: number) => void;
  moveSelectedKecamatansExcept: (excludeId: string, dx: number, dy: number) => void;
  setSelectedArea: (id: string | null) => void;
  setSelectedCluster: (id: string | null) => void;
  setSelectedRegion: (id: string | null) => void;
  setAllLocked: (locked: boolean) => void;
  setPresentationMode: (mode: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  alignLeft: () => void;
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
      user: null,
      regions: [{ id: 'jateng-3', name: 'JATENG 3' }],
      clusters: [{ id: 'default-cluster', name: 'Main Cluster', color: '#3b82f6', regionId: 'jateng-3' }],
      areas: [{ id: 'default-area', name: 'Main Area', color: '#3b82f6', clusterId: 'default-cluster' }],
      kecamatans: [],
      selectedKecamatanId: null,
      selectedKecamatanIds: [],
      selectedAreaId: 'default-area',
      selectedClusterId: 'default-cluster',
      selectedRegionId: 'jateng-3',
      isAllLocked: false,
      isPresentationMode: false,
      zoom: 1,
      pan: { x: 0, y: 0 },
      isSaving: false,
      isLoading: false,
      lastSaved: null,

      setUser: (user) => set({ user }),
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

      updateRegion: (id, updates) => set((state) => ({
        regions: state.regions.map((r) => (r.id === id ? { ...r, ...updates } : r))
      })),

      setSelectedKecamatan: (id) => set({ selectedKecamatanId: id, selectedKecamatanIds: id ? [id] : [] }),
      toggleKecamatanSelection: (id, multi) => set((state) => {
        if (!multi) {
          return { selectedKecamatanId: id, selectedKecamatanIds: [id] };
        }
        const isSelected = state.selectedKecamatanIds.includes(id);
        const newIds = isSelected 
          ? state.selectedKecamatanIds.filter(kId => kId !== id)
          : [...state.selectedKecamatanIds, id];
        return { 
          selectedKecamatanIds: newIds,
          selectedKecamatanId: newIds.length > 0 ? newIds[newIds.length - 1] : null
        };
      }),
      setSelectedKecamatanIds: (ids) => set({ 
        selectedKecamatanIds: ids,
        selectedKecamatanId: ids.length > 0 ? ids[ids.length - 1] : null
      }),
      moveSelectedKecamatans: (dx, dy) => set((state) => ({
        kecamatans: state.kecamatans.map(k => 
          state.selectedKecamatanIds.includes(k.id) && !k.isLocked
            ? { ...k, position: { x: k.position.x + dx, y: k.position.y + dy } }
            : k
        )
      })),
      moveSelectedKecamatansExcept: (excludeId, dx, dy) => set((state) => ({
        kecamatans: state.kecamatans.map(k => 
          k.id !== excludeId && state.selectedKecamatanIds.includes(k.id) && !k.isLocked
            ? { ...k, position: { x: k.position.x + dx, y: k.position.y + dy } }
            : k
        )
      })),
      setSelectedArea: (id) => set({ selectedAreaId: id }),
      setSelectedCluster: (id) => set({ selectedClusterId: id }),
      setSelectedRegion: (id) => set({ selectedRegionId: id }),
      setAllLocked: (locked) => set((state) => ({
        isAllLocked: locked,
        kecamatans: state.kecamatans.map(k => ({ ...k, isLocked: locked }))
      })),
      setPresentationMode: (mode) => set({ isPresentationMode: mode }),
      setZoom: (zoom) => set({ zoom }),
      setPan: (pan) => set({ pan }),
      alignLeft: () => set((state) => {
        if (state.kecamatans.length === 0) return state;
        const minX = Math.min(...state.kecamatans.map(k => k.position.x));
        return {
          kecamatans: state.kecamatans.map(k => ({
            ...k,
            position: { ...k.position, x: k.position.x - minX }
          }))
        };
      }),

      deleteKecamatan: (id) => set((state) => ({
        kecamatans: state.kecamatans.filter((k) => k.id !== id),
        selectedKecamatanId: state.selectedKecamatanId === id ? null : state.selectedKecamatanId,
        selectedKecamatanIds: state.selectedKecamatanIds.filter(kId => kId !== id)
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
        const { user, regions, clusters, areas, kecamatans, isLoading } = get();
        if (!user || isLoading) return; // Don't save if loading or not logged in

        set({ isSaving: true });
        try {
          const { error } = await supabase
            .from('map_data')
            .upsert({ 
              id: user.id, 
              data: { regions, clusters, areas, kecamatans },
              updated_at: new Date().toISOString()
            });
          
          if (error) throw error;
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
          // Fetch the most recently updated map data (publicly accessible)
          const { data, error } = await supabase
            .from('map_data')
            .select('data')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (error) throw error;
          
          if (data?.data) {
            set({ 
              regions: data.data.regions || [],
              clusters: data.data.clusters || [],
              areas: data.data.areas || [],
              kecamatans: data.data.kecamatans || []
            });
            set({ lastSaved: new Date() });
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setTimeout(() => set({ isLoading: false }), 500);
        }
      }
    })
  )
);
