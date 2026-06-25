"use client";

import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Property, Location } from "@/types";

interface MapViewProps {
  properties: Property[];
  locations: Location[];
  hoveredPropertyId: string | null;
  onPropertyHover: (property: Property | null, event: React.MouseEvent | null) => void;
  apiKey: string;
}

export default function MapView({
  properties,
  locations,
  hoveredPropertyId,
  onPropertyHover,
  apiKey,
}: MapViewProps) {
  const TOKYO_CENTER = { lat: 35.6762, lng: 139.6503 };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={TOKYO_CENTER}
        defaultZoom={12}
        mapId="tokyo-apt-map"
        style={{ width: "100%", height: "100%" }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        styles={[
          { elementType: "geometry", stylers: [{ color: "#1a2332" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1a2332" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#8899aa" }] },
          { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d4a84b" }] },
          { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#8899aa" }] },
          { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#162030" }] },
          { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C7A5A" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#253546" }] },
          { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a2d3e" }] },
          { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#66788a" }] },
          { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2d4a66" }] },
          { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f3a54" }] },
          { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#99aabb" }] },
          { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e2f42" }] },
          { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#aabbcc" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b2a" }] },
          { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d6b8e" }] },
          { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#0d1b2a" }] },
        ]}
      >
        {/* Location markers */}
        {locations.map((loc) => (
          <AdvancedMarker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }}>
            <div
              style={{
                background: loc.color,
                color: "white",
                borderRadius: "20px",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                boxShadow: `0 2px 12px ${loc.color}60`,
                border: `2px solid rgba(255,255,255,0.3)`,
                whiteSpace: "nowrap",
                letterSpacing: "0.02em",
              }}
            >
              {loc.label}
            </div>
          </AdvancedMarker>
        ))}

        {/* Property markers */}
        {properties
          .filter((p) => p.lat && p.lng && !p.loading && !p.error)
          .map((p) => (
            <AdvancedMarker
              key={p.id}
              position={{ lat: p.lat!, lng: p.lng! }}
              onMouseEnter={(e) => {
                // Create synthetic mouse event position from map event
                const syntheticEvent = {
                  clientX: window.innerWidth / 2,
                  clientY: window.innerHeight / 2,
                } as React.MouseEvent;
                onPropertyHover(p, syntheticEvent);
              }}
              onMouseLeave={() => onPropertyHover(null, null)}
            >
              <div
                style={{
                  width: hoveredPropertyId === p.id ? "18px" : "14px",
                  height: hoveredPropertyId === p.id ? "18px" : "14px",
                  background: hoveredPropertyId === p.id ? "#E63946" : "#F0EDE6",
                  border: `3px solid ${hoveredPropertyId === p.id ? "#fff" : "#E63946"}`,
                  borderRadius: "50%",
                  boxShadow: hoveredPropertyId === p.id
                    ? "0 0 0 4px rgba(230,57,70,0.3), 0 4px 12px rgba(0,0,0,0.5)"
                    : "0 2px 8px rgba(0,0,0,0.4)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              />
            </AdvancedMarker>
          ))}
      </Map>
    </APIProvider>
  );
}
