"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Property, Location } from "@/types";
import { DEFAULT_LOCATIONS } from "@/lib/locations";
import PropertyPanel from "@/components/PropertyPanel";
import LocationManager from "@/components/LocationManager";
import CommuteCard from "@/components/CommuteCard";

// Dynamically import map to avoid SSR issues
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [locations, setLocations] = useState<Location[]>(DEFAULT_LOCATIONS);
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  const addProperty = useCallback(async (url: string) => {
    const id = Date.now().toString();
    const pending: Property = { id, url, address: "", loading: true };
    setProperties((prev) => [pending, ...prev]);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (data.error) {
        setProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, loading: false, error: data.error } : p))
        );
      } else {
        setProperties((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  loading: false,
                  address: data.address,
                  name: data.name,
                  rent: data.rent,
                  lat: data.lat,
                  lng: data.lng,
                }
              : p
          )
        );
      }
    } catch {
      setProperties((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, loading: false, error: "Network error" } : p
        )
      );
    }
  }, []);

  const removeProperty = useCallback((id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
    if (hoveredProperty?.id === id) setHoveredProperty(null);
  }, [hoveredProperty]);

  const handlePropertyHover = useCallback(
    (property: Property | null, event: React.MouseEvent | null) => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);

      if (!property) {
        hideTimeout.current = setTimeout(() => setHoveredProperty(null), 200);
        return;
      }

      if (event) {
        setCardPos({ x: event.clientX, y: event.clientY });
      }
      setHoveredProperty(property);
    },
    []
  );

  const addLocation = useCallback((loc: Omit<Location, "id">) => {
    setLocations((prev) => [...prev, { ...loc, id: Date.now().toString() }]);
  }, []);

  const removeLocation = useCallback((id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return (
    <div className="app">
      <div className="sidebar">
        <PropertyPanel
          properties={properties}
          onAdd={addProperty}
          onRemove={removeProperty}
          onHover={handlePropertyHover}
          hoveredId={hoveredProperty?.id || null}
        />
        <LocationManager
          locations={locations}
          onAdd={addLocation}
          onRemove={removeLocation}
        />
      </div>

      <div className="map-area">
        {!GOOGLE_MAPS_KEY ? (
          <div className="no-key">
            <div className="no-key-card">
              <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
              <h2>Google Maps API Key Required</h2>
              <p>Add your key to <code>.env.local</code>:</p>
              <pre>{`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here\nGOOGLE_MAPS_API_KEY=your_key_here`}</pre>
              <p style={{ fontSize: 12, opacity: 0.5, marginTop: 12 }}>
                Enable Maps JavaScript API, Geocoding API, and Directions API
              </p>
            </div>
          </div>
        ) : (
          <MapView
            properties={properties}
            locations={locations}
            hoveredPropertyId={hoveredProperty?.id || null}
            onPropertyHover={handlePropertyHover}
            apiKey={GOOGLE_MAPS_KEY}
          />
        )}
      </div>

      {hoveredProperty && !hoveredProperty.loading && !hoveredProperty.error && (
        <CommuteCard
          property={hoveredProperty}
          locations={locations}
          position={cardPos}
          onClose={() => setHoveredProperty(null)}
        />
      )}

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        #__next, .app { height: 100%; }
        .app { display: flex; height: 100vh; background: #0F1923; }
        .sidebar {
          width: 300px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          height: 100vh;
          border-right: 1px solid rgba(255,255,255,0.07);
          overflow: hidden;
        }
        .map-area { flex: 1; position: relative; }
        .no-key {
          display: flex; align-items: center; justify-content: center;
          height: 100%; background: #0F1923;
        }
        .no-key-card {
          text-align: center; padding: 40px; max-width: 420px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; color: #F0EDE6;
        }
        .no-key-card h2 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
        .no-key-card p { font-size: 13px; color: rgba(240,237,230,0.6); margin-bottom: 8px; }
        .no-key-card pre {
          background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 12px; font-size: 11px;
          color: #4ECDC4; text-align: left; line-height: 1.8;
        }
        .no-key-card code { background: rgba(255,255,255,0.1); padding: 2px 5px; border-radius: 4px; font-size: 12px; }
      `}</style>
    </div>
  );
}
