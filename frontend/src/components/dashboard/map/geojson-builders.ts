import type { Feature, FeatureCollection, Geometry } from "geojson";
import {
  Airport,
  Sector,
  Aircraft,
  Mission,
  WeatherCondition,
  AirspaceRestriction,
} from "@/lib/api";

/**
 * Builds GeoJSON FeatureCollection for operational airspace sectors.
 * Enriches sectors with real-time weather observations.
 */
export function buildSectorsGeoJSON(
  sectors: Sector[],
  weather: WeatherCondition[] = []
): FeatureCollection<Geometry> {
  const weatherBySector = new Map<string, WeatherCondition>();
  for (const w of weather) {
    if (w.sector_id) {
      weatherBySector.set(w.sector_id, w);
    }
  }

  const features: Feature<Geometry>[] = sectors.map((sec) => {
    const w = weatherBySector.get(sec.id);
    const isWatch =
      sec.risk_level === "medium" ||
      sec.risk_level === "high" ||
      w?.condition === "thunderstorm" ||
      w?.condition === "heavy-rain";

    return {
      type: "Feature",
      id: sec.id,
      geometry: sec.boundary as Geometry,
      properties: {
        id: sec.id,
        code: sec.code,
        name: sec.name,
        risk_level: sec.risk_level,
        status: sec.status,
        is_watch: isWatch,
        weather_condition: w?.condition || "clear",
        weather_severity: w?.severity || "none",
        ceiling_ft: w?.ceiling_ft || 8000,
        visibility_km: w?.visibility_km || 10,
        wind_speed_kts: w?.wind_speed_kts || 8,
        wind_dir_deg: w?.wind_direction_deg || 0,
        is_vfr: w ? w.is_vfr : true,
      },
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Builds GeoJSON FeatureCollection for operational staging bases & airports.
 */
export function buildAirportsGeoJSON(
  airports: Airport[],
  aircraft: Aircraft[] = []
): FeatureCollection<Geometry> {
  const fleetByBase = new Map<string, number>();
  for (const ac of aircraft) {
    if (ac.base_airport_id) {
      fleetByBase.set(
        ac.base_airport_id,
        (fleetByBase.get(ac.base_airport_id) || 0) + 1
      );
    }
  }

  const features: Feature<Geometry>[] = airports.map((air) => ({
    type: "Feature",
    id: air.id,
    geometry: {
      type: "Point",
      coordinates: [air.longitude, air.latitude],
    },
    properties: {
      id: air.id,
      code: air.code,
      name: air.name,
      elevation_ft: air.elevation_ft,
      runway_length_m: air.runway_length_m,
      status: air.status,
      region: air.region,
      fuel_available: air.fuel_available,
      aircraft_stationed: fleetByBase.get(air.id) || 0,
    },
  }));

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Builds GeoJSON FeatureCollection for active & scheduled mission routes.
 */
/**
 * Builds GeoJSON FeatureCollection for active & scheduled mission routes.
 */
export function buildRoutesGeoJSON(
  missions: Mission[],
  airports: Airport[],
  selectedRouteId?: string | null,
  sectors: Sector[] = [],
  weather: WeatherCondition[] = []
): FeatureCollection<Geometry> {
  const airportMap = new Map<string, Airport>();
  for (const a of airports) {
    airportMap.set(a.id, a);
  }

  // Identify watch sectors or sectors with high risk / thunderstorm
  const watchSectorIds = new Set<string>();
  const weatherBySector = new Map<string, WeatherCondition>();
  for (const w of weather) {
    if (w.sector_id) weatherBySector.set(w.sector_id, w);
  }

  for (const s of sectors) {
    const w = weatherBySector.get(s.id);
    if (
      s.risk_level === "high" ||
      s.risk_level === "medium" ||
      w?.condition === "thunderstorm" ||
      w?.severity === "severe"
    ) {
      watchSectorIds.add(s.id);
    }
  }

  // Target airport (Bravo Base) is also in Sector B
  const affectedAirportIds = new Set<string>();
  for (const a of airports) {
    if (a.code === "SYN-BRAVO" || (a.name && a.name.toLowerCase().includes("bravo"))) {
      affectedAirportIds.add(a.id);
    }
  }

  const features: Feature<Geometry>[] = [];

  for (const m of missions) {
    const orig = airportMap.get(m.origin_airport_id);
    const dest = airportMap.get(m.destination_airport_id);

    if (!orig) continue;

    let coords: [number, number][];

    const isReassigned = m.status === "reassigned" || Boolean(m.notes && (m.notes.includes("Sector C") || m.notes.includes("CP-SAT")));

    if (dest && dest.id !== orig.id) {
      if (isReassigned && (m.sector_id && watchSectorIds.has(m.sector_id))) {
        // Safe inland detour corridor routed west through Sector C
        const inlandLng = Math.min(orig.longitude, dest.longitude) - 0.38;
        const midLat = (orig.latitude + dest.latitude) / 2;
        coords = [
          [orig.longitude, orig.latitude],
          [inlandLng, midLat],
          [dest.longitude, dest.latitude],
        ];
      } else {
        // Direct point-to-point corridor with gentle midpoint arc
        const midLng = (orig.longitude + dest.longitude) / 2;
        const midLat = (orig.latitude + dest.latitude) / 2;
        // Slight perpendicular offset for smooth flight curve
        const dx = dest.longitude - orig.longitude;
        const dy = dest.latitude - orig.latitude;
        const curveFactor = 0.08;
        const arcLng = midLng - dy * curveFactor;
        const arcLat = midLat + dx * curveFactor;

        coords = [
          [orig.longitude, orig.latitude],
          [arcLng, arcLat],
          [dest.longitude, dest.latitude],
        ];
      }
    } else {
      // Local area circular reconnaissance orbit
      const r = 0.25;
      coords = [
        [orig.longitude, orig.latitude],
        [orig.longitude + r, orig.latitude + r * 0.7],
        [orig.longitude + r * 1.2, orig.latitude - r * 0.4],
        [orig.longitude, orig.latitude],
      ];
    }

    const isSelected = selectedRouteId === m.id;
    const isActive = m.status === "active";
    const isTraversingWatchSector = Boolean(m.sector_id && watchSectorIds.has(m.sector_id));
    const isUsingWatchBase =
      affectedAirportIds.has(m.origin_airport_id) ||
      affectedAirportIds.has(m.destination_airport_id);
    const isAffected = !isReassigned && (isTraversingWatchSector || isUsingWatchBase);

    features.push({
      type: "Feature",
      id: m.id,
      geometry: {
        type: "LineString",
        coordinates: coords,
      },
      properties: {
        id: m.id,
        code: m.code,
        title: m.title,
        type: m.type,
        priority: m.priority,
        status: m.status,
        origin_code: orig.code,
        destination_code: dest?.code || orig.code,
        aircraft_model: m.required_aircraft_model || "AeroLift M1",
        cargo_weight_kg: m.cargo_weight_kg,
        passenger_count: m.passenger_count,
        urgency_score: m.urgency_score,
        scheduled_start: m.scheduled_start,
        scheduled_end: m.scheduled_end,
        is_active: isActive,
        is_selected: isSelected,
        is_affected: isAffected,
        is_reassigned: isReassigned,
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Builds GeoJSON FeatureCollection for synthetic fleet aircraft positions.
 */
export function buildAircraftGeoJSON(
  aircraft: Aircraft[],
  airports: Airport[],
  missions: Mission[]
): FeatureCollection<Geometry> {
  const airportMap = new Map<string, Airport>();
  for (const a of airports) {
    airportMap.set(a.id, a);
  }

  const activeMissionByAircraft = new Map<string, Mission>();
  for (const m of missions) {
    if (m.assigned_aircraft_id && m.status === "active") {
      activeMissionByAircraft.set(m.assigned_aircraft_id, m);
    }
  }

  // Offset counter for aircraft stationed at the same base
  const baseCounters = new Map<string, number>();

  const features: Feature<Geometry>[] = [];

  aircraft.forEach((ac, idx) => {
    let lng: number;
    let lat: number;
    let heading = 45;
    let isEnRoute = false;

    const mission = activeMissionByAircraft.get(ac.id);

    if (mission) {
      const orig = airportMap.get(mission.origin_airport_id);
      const dest = airportMap.get(mission.destination_airport_id);
      if (orig && dest) {
        // En route interpolation (~40% along the path)
        const progress = 0.35 + (idx % 3) * 0.15;
        lng = orig.longitude + (dest.longitude - orig.longitude) * progress;
        lat = orig.latitude + (dest.latitude - orig.latitude) * progress;
        // Calculate heading in degrees
        const dLng = dest.longitude - orig.longitude;
        const dLat = dest.latitude - orig.latitude;
        heading = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI);
        if (heading < 0) heading += 360;
        isEnRoute = true;
      } else {
        lng = 77.209;
        lat = 28.6139;
      }
    } else {
      const base = ac.base_airport_id
        ? airportMap.get(ac.base_airport_id)
        : null;
      if (base) {
        const count = baseCounters.get(base.id) || 0;
        baseCounters.set(base.id, count + 1);

        // Small circular apron parking offset around base coordinate
        const angle = (count * 45 * Math.PI) / 180;
        const radius = 0.05 + Math.floor(count / 8) * 0.03;
        lng = base.longitude + Math.cos(angle) * radius;
        lat = base.latitude + Math.sin(angle) * (radius * 0.8);
      } else {
        lng = 77.209 + (idx % 4) * 0.08;
        lat = 28.6139 + Math.floor(idx / 4) * 0.08;
      }
    }

    features.push({
      type: "Feature",
      id: ac.id,
      geometry: {
        type: "Point",
        coordinates: [lng, lat],
      },
      properties: {
        id: ac.id,
        tail_number: ac.tail_number,
        registration: ac.tail_number,
        model: ac.model,
        role: ac.role,
        status: ac.status,
        fuel_level_percent: ac.fuel_level_percent,
        flight_hours: ac.flight_hours,
        heading_deg: heading,
        is_en_route: isEnRoute,
        active_mission_code: mission?.code || null,
      },
    });
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Builds GeoJSON FeatureCollection for active airspace restrictions (NOTAMs).
 */
export function buildRestrictionsGeoJSON(
  restrictions: AirspaceRestriction[],
  sectors: Sector[]
): FeatureCollection<Geometry> {
  const sectorMap = new Map<string, Sector>();
  for (const s of sectors) {
    sectorMap.set(s.id, s);
  }

  const features: Feature<Geometry>[] = [];

  for (const res of restrictions) {
    if (res.status !== "active" && res.status !== "pending") continue;

    let geometry: Geometry;

    if (res.boundary && typeof res.boundary === "object") {
      geometry = res.boundary as Geometry;
    } else if (res.sector_id && sectorMap.has(res.sector_id)) {
      // Sub-box inside sector for designated hazard
      const s = sectorMap.get(res.sector_id)!;
      const b = s.boundary as { coordinates?: number[][][] };
      if (b?.coordinates?.[0]?.length) {
        // Inset polygon box
        const coords = b.coordinates[0];
        const minLng = Math.min(...coords.map((c) => c[0]));
        const maxLng = Math.max(...coords.map((c) => c[0]));
        const minLat = Math.min(...coords.map((c) => c[1]));
        const maxLat = Math.max(...coords.map((c) => c[1]));

        const insetMinLng = minLng + (maxLng - minLng) * 0.2;
        const insetMaxLng = minLng + (maxLng - minLng) * 0.8;
        const insetMinLat = minLat + (maxLat - minLat) * 0.2;
        const insetMaxLat = minLat + (maxLat - minLat) * 0.8;

        geometry = {
          type: "Polygon",
          coordinates: [
            [
              [insetMinLng, insetMinLat],
              [insetMaxLng, insetMinLat],
              [insetMaxLng, insetMaxLat],
              [insetMinLng, insetMaxLat],
              [insetMinLng, insetMinLat],
            ],
          ],
        };
      } else {
        continue;
      }
    } else {
      continue;
    }

    features.push({
      type: "Feature",
      id: res.id,
      geometry,
      properties: {
        id: res.id,
        identifier: res.identifier,
        name: res.name,
        type: res.type,
        status: res.status,
        altitude_floor_ft: res.altitude_floor_ft,
        altitude_ceiling_ft: res.altitude_ceiling_ft,
        reason: res.reason,
        active_from: res.active_from,
        active_until: res.active_until,
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Computes bounding box `[[minLng, minLat], [maxLng, maxLat]]` for all operational points.
 */
export function calculateOperationalBounds(
  airports: Airport[],
  sectors: Sector[]
): [[number, number], [number, number]] {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const a of airports) {
    if (a.longitude < minLng) minLng = a.longitude;
    if (a.longitude > maxLng) maxLng = a.longitude;
    if (a.latitude < minLat) minLat = a.latitude;
    if (a.latitude > maxLat) maxLat = a.latitude;
  }

  for (const s of sectors) {
    const b = s.boundary as { coordinates?: number[][][] };
    if (b?.coordinates?.[0]) {
      for (const [lng, lat] of b.coordinates[0]) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }

  if (!isFinite(minLng)) {
    // Default fallback to central operations area
    return [
      [71.0, 16.0],
      [90.0, 32.0],
    ];
  }

  // Add 8% buffer padding around bounds
  const dLng = (maxLng - minLng) * 0.08;
  const dLat = (maxLat - minLat) * 0.08;

  return [
    [minLng - dLng, minLat - dLat],
    [maxLng + dLng, maxLat + dLat],
  ];
}
