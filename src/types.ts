export interface Kecamatan {
  id: string;
  name: string;
  path: string;
  color: string;
  label: string;
  position: { x: number; y: number };
  scale: number;
  areaId: string;
  viewBox?: string;
  isLocked?: boolean;
}

export interface Area {
  id: string;
  name: string;
  color: string;
  clusterId: string;
}

export interface Cluster {
  id: string;
  name: string;
  color: string;
  regionId: string;
}

export interface Region {
  id: string;
  name: string;
}

export interface MapState {
  regions: Region[];
  clusters: Cluster[];
  areas: Area[];
  kecamatans: Kecamatan[];
  selectedKecamatanId: string | null;
  selectedAreaId: string | null;
  selectedClusterId: string | null;
  selectedRegionId: string | null;
  isAllLocked: boolean;
  zoom: number;
  pan: { x: number; y: number };
}
