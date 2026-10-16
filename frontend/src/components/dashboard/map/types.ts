import {
  Airport,
  Sector,
  Aircraft,
  Mission,
  WeatherCondition,
  AirspaceRestriction,
} from "@/lib/api";

export type MapFeatureType =
  | "airport"
  | "aircraft"
  | "sector"
  | "route"
  | "restriction";

export interface SelectedFeature {
  type: MapFeatureType;
  id: string;
  data:
    | Airport
    | Aircraft
    | Sector
    | Mission
    | AirspaceRestriction
    | Record<string, unknown>;
}

export interface LayerVisibility {
  sectors: boolean;
  airports: boolean;
  routes: boolean;
  aircraft: boolean;
  restrictions: boolean;
}

export interface OperationalMapProps {
  airports: Airport[];
  sectors: Sector[];
  aircraft?: Aircraft[];
  missions: Mission[];
  weather?: WeatherCondition[];
  restrictions?: AirspaceRestriction[];
  loading?: boolean;
  selectedFeature?: SelectedFeature | null;
  onSelectFeature?: (feature: SelectedFeature | null) => void;
  className?: string;
}

export interface HoverTooltipState {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  status?: string;
  statusType?: "nominal" | "warning" | "critical" | "info";
}
