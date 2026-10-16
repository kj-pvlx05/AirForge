"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { Map as MapLibreMapInstance, GeoJSONSource } from "maplibre-gl";
import {
  SelectedFeature,
  LayerVisibility,
  OperationalMapProps,
} from "./map/types";
import {
  Sector,
  AirspaceRestriction,
  Mission,
  Airport,
  Aircraft,
} from "@/lib/api";
import {
  buildSectorsGeoJSON,
  buildAirportsGeoJSON,
  buildRoutesGeoJSON,
  buildAircraftGeoJSON,
  buildRestrictionsGeoJSON,
  calculateOperationalBounds,
} from "./map/geojson-builders";
import { MapControls } from "./map/map-controls";
import { MapInspector } from "./map/map-inspector";

export function OperationalMap({
  airports,
  sectors,
  aircraft = [],
  missions,
  weather = [],
  restrictions = [],
  loading = false,
  selectedFeature,
  onSelectFeature,
  className = "",
}: OperationalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMapInstance | null>(null);

  const [layers, setLayers] = useState<LayerVisibility>({
    sectors: true,
    airports: true,
    routes: true,
    aircraft: true,
    restrictions: true,
  });

  const [internalSelected, setInternalSelected] = useState<SelectedFeature | null>(null);
  const selected = selectedFeature !== undefined ? selectedFeature : internalSelected;
  const [mapInitialized, setMapInitialized] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Synchronize selection state with external handler if provided
  const handleSelect = useCallback(
    (feature: SelectedFeature | null) => {
      setInternalSelected(feature);
      if (onSelectFeature) {
        onSelectFeature(feature);
      }
    },
    [onSelectFeature]
  );

  // Pre-calculate GeoJSON structures
  const sectorsGeoJSON = useMemo(
    () => buildSectorsGeoJSON(sectors, weather),
    [sectors, weather]
  );
  const airportsGeoJSON = useMemo(
    () => buildAirportsGeoJSON(airports, aircraft),
    [airports, aircraft]
  );
  const routesGeoJSON = useMemo(
    () =>
      buildRoutesGeoJSON(
        missions,
        airports,
        selected?.type === "route" ? selected.id : null,
        sectors,
        weather
      ),
    [missions, airports, selected, sectors, weather]
  );
  const aircraftGeoJSON = useMemo(
    () => buildAircraftGeoJSON(aircraft, airports, missions),
    [aircraft, airports, missions]
  );
  const restrictionsGeoJSON = useMemo(
    () => buildRestrictionsGeoJSON(restrictions, sectors),
    [restrictions, sectors]
  );

  // Operational bounds for fitting the camera
  const operationalBounds = useMemo(
    () => calculateOperationalBounds(airports, sectors),
    [airports, sectors]
  );

  // Initialize MapLibre GL
  useEffect(() => {
    let map: MapLibreMapInstance | null = null;
    let isMounted = true;

    async function init() {
      if (!mapContainerRef.current) return;

      try {
        const maplibreModule = await import("maplibre-gl");
        const maplibregl =
          "default" in maplibreModule
            ? (maplibreModule.default as typeof maplibreModule)
            : maplibreModule;

        await import("maplibre-gl/dist/maplibre-gl.css");

        if (
          typeof maplibregl.setWorkerUrl === "function" &&
          typeof window !== "undefined"
        ) {
          maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        }

        // Check if WebGL is supported
        const mlAny = maplibregl as unknown as { supported?: () => boolean };
        if (typeof mlAny.supported === "function" && !mlAny.supported()) {
          console.warn("[AEROSYNC Map] WebGL unsupported, enabling vector mode.");
          setUseFallback(true);
          return;
        }

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: {
            version: 8,
            sources: {
              "osm-tiles": {
                type: "raster",
                tiles: [
                  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                ],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors",
              },
            },
            layers: [
              {
                id: "osm-light-layer",
                type: "raster",
                source: "osm-tiles",
                minzoom: 0,
                maxzoom: 19,
                paint: {
                  "raster-saturation": -0.9,
                  "raster-contrast": -0.2,
                  "raster-brightness-min": 0.3,
                  "raster-opacity": 0.65,
                },
              },
            ],
          },
          bounds: operationalBounds,
          fitBoundsOptions: { padding: 48 },
          attributionControl: false,
        });

        // Add standard navigation controls
        const nav = new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
        });
        map.addControl(nav, "bottom-right");

        map.on("load", () => {
          if (!isMounted || !map) return;

          // 1. ADD GEOJSON SOURCES
          map.addSource("source-sectors", {
            type: "geojson",
            data: sectorsGeoJSON,
          });
          map.addSource("source-restrictions", {
            type: "geojson",
            data: restrictionsGeoJSON,
          });
          map.addSource("source-routes", {
            type: "geojson",
            data: routesGeoJSON,
          });
          map.addSource("source-airports", {
            type: "geojson",
            data: airportsGeoJSON,
          });
          map.addSource("source-aircraft", {
            type: "geojson",
            data: aircraftGeoJSON,
          });

          // 2. ADD SECTORS LAYERS
          map.addLayer({
            id: "layer-sectors-fill",
            type: "fill",
            source: "source-sectors",
            paint: {
              "fill-color": [
                "case",
                ["get", "is_watch"],
                "#D97706", // Amber for watch
                "#8B7CF6", // Lavender for normal
              ],
              "fill-opacity": [
                "case",
                ["get", "is_watch"],
                0.14,
                0.08,
              ],
            },
          });

          map.addLayer({
            id: "layer-sectors-line",
            type: "line",
            source: "source-sectors",
            paint: {
              "line-color": [
                "case",
                ["get", "is_watch"],
                "#D97706",
                "#8B7CF6",
              ],
              "line-width": [
                "case",
                ["get", "is_watch"],
                2.0,
                1.2,
              ],
              "line-opacity": 0.6,
            },
          });

          // 3. ADD AIRSPACE RESTRICTIONS LAYERS
          map.addLayer({
            id: "layer-restrictions-fill",
            type: "fill",
            source: "source-restrictions",
            paint: {
              "fill-color": "#DC2626",
              "fill-opacity": 0.12,
            },
          });

          map.addLayer({
            id: "layer-restrictions-line",
            type: "line",
            source: "source-restrictions",
            paint: {
              "line-color": "#DC2626",
              "line-width": 1.6,
              "line-dasharray": [3, 2],
              "line-opacity": 0.7,
            },
          });

          // 4. ADD ROUTES LAYERS
          map.addLayer({
            id: "layer-routes-line",
            type: "line",
            source: "source-routes",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": [
                "case",
                ["get", "is_selected"],
                "#8B7CF6",
                ["get", "is_reassigned"],
                "#16A34A",
                ["get", "is_affected"],
                "#D97706",
                ["get", "is_active"],
                "#8B7CF6",
                "#A99FF8",
              ],
              "line-width": [
                "case",
                ["get", "is_selected"],
                3.5,
                ["get", "is_reassigned"],
                2.8,
                ["get", "is_affected"],
                2.6,
                ["get", "is_active"],
                2.5,
                1.5,
              ],
              "line-opacity": [
                "case",
                ["get", "is_selected"],
                1.0,
                ["get", "is_reassigned"],
                0.95,
                ["get", "is_affected"],
                0.95,
                ["get", "is_active"],
                0.85,
                0.5,
              ],
              "line-dasharray": [
                "case",
                ["get", "is_affected"],
                ["literal", [3, 2]],
                ["get", "is_active"],
                ["literal", [1, 0]],
                ["literal", [2, 2]],
              ],
            },
          });

          // 5. ADD AIRPORT BASES LAYER
          map.addLayer({
            id: "layer-airports-outer",
            type: "circle",
            source: "source-airports",
            paint: {
              "circle-radius": 8,
              "circle-color": "#FFFFFF",
              "circle-stroke-color": "#8B7CF6",
              "circle-stroke-width": 2,
            },
          });

          map.addLayer({
            id: "layer-airports-inner",
            type: "circle",
            source: "source-airports",
            paint: {
              "circle-radius": 4,
              "circle-color": "#16A34A",
            },
          });

          // 6. ADD AIRCRAFT FLEET LAYER
          map.addLayer({
            id: "layer-aircraft-circle",
            type: "circle",
            source: "source-aircraft",
            paint: {
              "circle-radius": 5.5,
              "circle-color": [
                "case",
                ["==", ["get", "status"], "available"],
                "#16A34A",
                ["==", ["get", "status"], "assigned"],
                "#8B7CF6",
                ["==", ["get", "status"], "maintenance"],
                "#D97706",
                ["==", ["get", "status"], "grounded"],
                "#DC2626",
                "#77738A",
              ],
              "circle-stroke-color": "#FFFFFF",
              "circle-stroke-width": 1.5,
            },
          });

          // 7. INTERACTIVE CLICK HANDLERS
          map.on("click", "layer-airports-outer", (e) => {
            if (e.features?.[0]) {
              const air = airports.find(
                (a) => a.id === e.features![0].properties?.id
              );
              if (air) handleSelect({ type: "airport", id: air.id, data: air });
            }
          });

          map.on("click", "layer-aircraft-circle", (e) => {
            if (e.features?.[0]) {
              const ac = aircraft.find(
                (a) => a.id === e.features![0].properties?.id
              );
              if (ac) handleSelect({ type: "aircraft", id: ac.id, data: ac });
            }
          });

          map.on("click", "layer-sectors-fill", (e) => {
            if (e.features?.[0]) {
              const sec = sectors.find(
                (s) => s.id === e.features![0].properties?.id
              );
              if (sec) handleSelect({ type: "sector", id: sec.id, data: sec });
            }
          });

          map.on("click", "layer-routes-line", (e) => {
            if (e.features?.[0]) {
              const m = missions.find(
                (ms) => ms.id === e.features![0].properties?.id
              );
              if (m) handleSelect({ type: "route", id: m.id, data: m });
            }
          });

          map.on("click", "layer-restrictions-fill", (e) => {
            if (e.features?.[0]) {
              const res = restrictions.find(
                (r) => r.id === e.features![0].properties?.id
              );
              if (res)
                handleSelect({ type: "restriction", id: res.id, data: res });
            }
          });

          // Cursor pointer on hoverable layers
          const interactiveLayers = [
            "layer-airports-outer",
            "layer-aircraft-circle",
            "layer-sectors-fill",
            "layer-routes-line",
            "layer-restrictions-fill",
          ];
          for (const lId of interactiveLayers) {
            map.on("mouseenter", lId, () => {
              if (map) map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", lId, () => {
              if (map) map.getCanvas().style.cursor = "";
            });
          }

          mapInstanceRef.current = map;
          setMapInitialized(true);
        });

        map.on("error", (e) => {
          // Log without automatically switching to fallback unless canvas failed
          console.warn("[AEROSYNC Map event warning]", e);
        });
      } catch (err) {
        console.warn("[AEROSYNC Map] Initialization failed, using vector mode:", err);
        setUseFallback(true);
      }
    }

    init();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationalBounds, handleSelect]);

  // Reactive updates to GeoJSON sources when state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapInitialized) return;

    try {
      const secSource = map.getSource("source-sectors") as GeoJSONSource;
      if (secSource) secSource.setData(sectorsGeoJSON);

      const airSource = map.getSource("source-airports") as GeoJSONSource;
      if (airSource) airSource.setData(airportsGeoJSON);

      const routeSource = map.getSource("source-routes") as GeoJSONSource;
      if (routeSource) routeSource.setData(routesGeoJSON);

      const acSource = map.getSource("source-aircraft") as GeoJSONSource;
      if (acSource) acSource.setData(aircraftGeoJSON);

      const resSource = map.getSource("source-restrictions") as GeoJSONSource;
      if (resSource) resSource.setData(restrictionsGeoJSON);
    } catch (err) {
      console.warn("[AEROSYNC Map] Error updating GeoJSON sources:", err);
    }
  }, [
    mapInitialized,
    sectorsGeoJSON,
    airportsGeoJSON,
    routesGeoJSON,
    aircraftGeoJSON,
    restrictionsGeoJSON,
  ]);

  // Reactive layer visibility toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapInitialized) return;

    const setVis = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
      }
    };

    setVis("layer-sectors-fill", layers.sectors);
    setVis("layer-sectors-line", layers.sectors);
    setVis("layer-airports-outer", layers.airports);
    setVis("layer-airports-inner", layers.airports);
    setVis("layer-routes-line", layers.routes);
    setVis("layer-aircraft-circle", layers.aircraft);
    setVis("layer-restrictions-fill", layers.restrictions);
    setVis("layer-restrictions-line", layers.restrictions);
  }, [mapInitialized, layers]);

  // Fit bounds handler
  const handleFitBounds = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.fitBounds(operationalBounds, {
        padding: 56,
        duration: 900,
        essential: true,
      });
    }
  }, [operationalBounds]);

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const clearSelection = () => {
    handleSelect(null);
  };

  return (
    <div
      className={`aero-card relative flex flex-col h-full min-h-[480px] overflow-hidden ${className}`}
    >
      {/* Top Map Control Bar */}
      <MapControls
        layers={layers}
        onToggleLayer={toggleLayer}
        onFitBounds={handleFitBounds}
        hasSelection={selected !== null}
        onClearSelection={clearSelection}
      />

      {/* MapLibre WebGL Canvas Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full min-h-[480px] ${
          useFallback ? "hidden" : "block"
        }`}
      />

      {/* Graceful Vector SVG Fallback (Preserved as non-blocking contingency) */}
      {(useFallback || !mapInitialized) && (
        <div className="w-full h-full min-h-[480px] bg-background/70 relative flex items-center justify-center p-6 select-none overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-surface/40 backdrop-blur-xs flex items-center justify-center z-10">
              <span className="text-xs text-primary font-mono animate-pulse">
                Synchronizing operational telemetry…
              </span>
            </div>
          )}

          {/* Tactical grid background */}
          <svg className="absolute inset-0 w-full h-full stroke-border/40 [mask-image:radial-gradient(ellipse_at_center,white,transparent_85%)]">
            <defs>
              <pattern
                id="tactical-grid"
                width="36"
                height="36"
                patternUnits="userSpaceOnUse"
              >
                <path d="M 36 0 L 0 0 0 36" fill="none" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tactical-grid)" />
          </svg>

          {/* Fallback Vector Diagram */}
          <svg
            viewBox="0 0 800 480"
            className="w-full h-full max-w-[900px] max-h-[500px] relative z-1"
          >
            {/* Sector Polygons */}
            {layers.sectors && (
              <g className="transition-opacity duration-300">
                {/* Sector A */}
                <polygon
                  points="260,70 380,60 390,160 250,170"
                  fill="rgba(139, 124, 246, 0.08)"
                  stroke="rgba(139, 124, 246, 0.45)"
                  strokeWidth="1.2"
                  className="cursor-pointer hover:fill-[rgba(139,124,246,0.16)] transition-colors"
                  onClick={() => {
                    const sec = sectors.find((s) => s.code === "SEC-A") || {
                      id: "sec-a",
                      code: "SEC-A",
                      name: "Sector A - Northern Highlands",
                      risk_level: "low",
                      status: "active",
                    };
                    handleSelect({ type: "sector", id: sec.id, data: sec as Sector });
                  }}
                />
                <text
                  x="300"
                  y="125"
                  fill="#77738A"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  SEC-A [HIGH-OPS]
                </text>

                {/* Sector B (Watch) */}
                <polygon
                  points="200,280 280,270 290,410 190,400"
                  fill="rgba(217, 119, 6, 0.12)"
                  stroke="rgba(217, 119, 6, 0.65)"
                  strokeWidth="1.8"
                  className="cursor-pointer hover:fill-[rgba(217,119,6,0.22)] transition-colors"
                  onClick={() => {
                    const sec = sectors.find((s) => s.code === "SEC-B") || {
                      id: "sec-b",
                      code: "SEC-B",
                      name: "Sector B - Coastal Corridor",
                      risk_level: "medium",
                      status: "active",
                      is_watch: true,
                    };
                    handleSelect({ type: "sector", id: sec.id, data: sec as Sector });
                  }}
                />
                <text
                  x="215"
                  y="345"
                  fill="#D97706"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  SEC-B [WATCH]
                </text>

                {/* Sector C */}
                <polygon
                  points="350,260 480,250 490,380 340,370"
                  fill="rgba(139, 124, 246, 0.08)"
                  stroke="rgba(139, 124, 246, 0.45)"
                  strokeWidth="1.2"
                  className="cursor-pointer hover:fill-[rgba(139,124,246,0.16)] transition-colors"
                  onClick={() => {
                    const sec = sectors.find((s) => s.code === "SEC-C") || {
                      id: "sec-c",
                      code: "SEC-C",
                      name: "Sector C - Central Corridor",
                      risk_level: "low",
                      status: "active",
                    };
                    handleSelect({ type: "sector", id: sec.id, data: sec as Sector });
                  }}
                />
                <text
                  x="390"
                  y="320"
                  fill="#77738A"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  SEC-C [CORRIDOR]
                </text>

                {/* Sector D */}
                <polygon
                  points="510,270 620,260 625,395 515,390"
                  fill="rgba(139, 124, 246, 0.08)"
                  stroke="rgba(139, 124, 246, 0.45)"
                  strokeWidth="1.2"
                  className="cursor-pointer hover:fill-[rgba(139,124,246,0.16)] transition-colors"
                  onClick={() => {
                    const sec = sectors.find((s) => s.code === "SEC-D") || {
                      id: "sec-d",
                      code: "SEC-D",
                      name: "Sector D - Eastern Relief Zone",
                      risk_level: "medium",
                      status: "active",
                    };
                    handleSelect({ type: "sector", id: sec.id, data: sec as Sector });
                  }}
                />
                <text
                  x="530"
                  y="335"
                  fill="#77738A"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  SEC-D [RELIEF]
                </text>
              </g>
            )}

            {/* Airspace Restrictions */}
            {layers.restrictions && (
              <g className="transition-opacity duration-300">
                <rect
                  x="540"
                  y="290"
                  width="65"
                  height="70"
                  fill="rgba(220, 38, 38, 0.12)"
                  stroke="#DC2626"
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                  className="cursor-pointer"
                  onClick={() => {
                    const res = restrictions[0] || {
                      id: "notam-1",
                      identifier: "NOTAM-SEC-D-01",
                      name: "Delta Flood Relief Transit Corridor",
                      type: "relief-corridor",
                      status: "active",
                      altitude_floor_ft: 500,
                      altitude_ceiling_ft: 6000,
                      reason: "Dedicated low-altitude humanitarian airlift corridor.",
                    };
                    handleSelect({
                      type: "restriction",
                      id: res.id,
                      data: res as AirspaceRestriction,
                    });
                  }}
                />
              </g>
            )}

            {/* Flight Routes */}
            {layers.routes && (
              <g className="transition-opacity duration-300">
                <path
                  d="M 330 140 Q 300 240 240 330"
                  fill="none"
                  stroke="#A99FF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="cursor-pointer hover:stroke-primary hover:stroke-width-3 transition-all"
                  onClick={() => {
                    const m = missions[0] || {
                      id: "m-1",
                      code: "MSN-2026-01",
                      title: "Emergency Pediatric Medevac",
                      priority: "critical",
                      status: "scheduled",
                    };
                    handleSelect({ type: "route", id: m.id, data: m as Mission });
                  }}
                />
                <path
                  d="M 330 140 Q 420 250 560 350"
                  fill="none"
                  stroke="#A99FF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="cursor-pointer hover:stroke-primary hover:stroke-width-3 transition-all"
                  onClick={() => {
                    const m = missions[1] || {
                      id: "m-2",
                      code: "MSN-2026-03",
                      title: "Critical Water Purification Airlift",
                      priority: "critical",
                      status: "scheduled",
                    };
                    handleSelect({ type: "route", id: m.id, data: m as Mission });
                  }}
                />
                {/* Active route */}
                <path
                  d="M 410 320 Q 490 320 560 350"
                  fill="none"
                  stroke="#8B7CF6"
                  strokeWidth="2.5"
                  className="cursor-pointer hover:stroke-width-3 transition-all"
                  onClick={() => {
                    const m = missions[2] || {
                      id: "m-3",
                      code: "MSN-2026-05",
                      title: "Central Food Rations Bulk Distribution",
                      priority: "high",
                      status: "active",
                    };
                    handleSelect({ type: "route", id: m.id, data: m as Mission });
                  }}
                />
              </g>
            )}

            {/* Base Airports */}
            {layers.airports && (
              <g className="transition-opacity duration-300">
                {[
                  { id: "air-1", code: "SYN-ALPHA", x: 330, y: 140, name: "Alpha Air Station" },
                  { id: "air-2", code: "SYN-BRAVO", x: 240, y: 330, name: "Bravo Forward Base" },
                  { id: "air-3", code: "SYN-CHARLIE", x: 410, y: 320, name: "Charlie Logistics Hub" },
                  { id: "air-4", code: "SYN-DELTA", x: 560, y: 350, name: "Delta Relief Camp" },
                  { id: "air-5", code: "SYN-ECHO", x: 290, y: 90, name: "Echo Mountain Outpost" },
                ].map((b) => (
                  <g
                    key={b.code}
                    className="cursor-pointer group"
                    onClick={() => {
                      const air =
                        airports.find((a) => a.code === b.code) || {
                          id: b.id,
                          code: b.code,
                          name: b.name,
                          elevation_ft: 710,
                          runway_length_m: 2400,
                          status: "operational",
                          latitude: 28.6,
                          longitude: 77.2,
                        };
                      handleSelect({ type: "airport", id: air.id, data: air as Airport });
                    }}
                  >
                    <circle
                      cx={b.x}
                      cy={b.y}
                      r="12"
                      fill="rgba(139, 124, 246, 0.12)"
                      stroke="#8B7CF6"
                      strokeWidth="1.2"
                      className="group-hover:scale-125 transition-transform origin-center"
                    />
                    <circle cx={b.x} cy={b.y} r="4.5" fill="#16A34A" />
                    <rect
                      x={b.x - 34}
                      y={b.y + 16}
                      width="68"
                      height="18"
                      rx="5"
                      fill="#FFFFFF"
                      stroke="#EAE7F2"
                      strokeWidth="1"
                    />
                    <text
                      x={b.x}
                      y={b.y + 29}
                      textAnchor="middle"
                      fill="#1E1B2E"
                      fontSize="9.5"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      {b.code}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Aircraft Units */}
            {layers.aircraft && (
              <g className="transition-opacity duration-300">
                <g
                  transform="translate(485, 320)"
                  className="cursor-pointer"
                  onClick={() => {
                    const ac = aircraft[0] || {
                      id: "ac-1",
                      registration: "AS-LM03",
                      model: "AeroLift M1",
                      role: "medevac",
                      status: "assigned",
                      fuel_level_percent: 88,
                      flight_hours: 420,
                    };
                    handleSelect({ type: "aircraft", id: ac.id, data: ac as Aircraft });
                  }}
                >
                  <circle cx="0" cy="0" r="5" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.5" />
                  <rect x="-24" y="-18" width="48" height="14" rx="4" fill="#FFFFFF" stroke="#EAE7F2" />
                  <text x="0" y="-8" textAnchor="middle" fill="#1E1B2E" fontSize="8" fontWeight="600" fontFamily="monospace">
                    AS-LM03
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>
      )}

      {/* Floating Interactive Map Inspector */}
      <MapInspector selected={selected} onClose={clearSelection} />

      {/* Bottom Status Ribbon */}
      <div className="border-t border-border/80 bg-background/50 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-aero-success" />
            <span>Airspace Active ({sectors.length || 6} Sectors)</span>
          </span>
          <span className="text-border">·</span>
          <span>{airports.length || 5} Staging Bases</span>
          <span className="text-border">·</span>
          <span>{missions.length || 16} Planned Tracks</span>
          {restrictions.length > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="text-aero-warning font-medium">
                {restrictions.length} NOTAM Advisories
              </span>
            </>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-muted-foreground/80">
          <span>COORDINATES: 28°N 77°E</span>
          <span>·</span>
          <span>DATUM: WGS-84</span>
        </div>
      </div>
    </div>
  );
}
