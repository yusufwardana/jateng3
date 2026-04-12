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
  isVisible?: boolean;
}

export interface Area {
  id: string;
  name: string;
  color: string;
  clusterId: string;
  isVisible?: boolean;
}

export interface Cluster {
  id: string;
  name: string;
  color: string;
  regionId: string;
  isVisible?: boolean;
}

export interface Region {
  id: string;
  name: string;
  isVisible?: boolean;
}

export interface MapState {
  regions: Region[];
  clusters: Cluster[];
  areas: Area[];
  kecamatans: Kecamatan[];
  selectedKecamatanId: string | null;
  selectedKecamatanIds: string[];
  selectedAreaId: string | null;
  selectedClusterId: string | null;
  selectedRegionId: string | null;
  isAllLocked: boolean;
  zoom: number;
  pan: { x: number; y: number };
}
