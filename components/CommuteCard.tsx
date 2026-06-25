"use client";

import { useEffect, useState, useRef } from "react";
import { Property, Location, CommuteInfo } from "@/types";

interface CommuteCardProps {
  property: Property;
  locations: Location[];
  position: { x: number; y: number };
  onClose: () => void;
}

export default function CommuteCard({
  property,
  locations,
  position,
  onClose,
}: CommuteCardProps) {
  const [commutes, setCommutes] = useState<Record<string, { transit?: CommuteInfo; walking?: CommuteInfo } | null>>({});
  const [activeLocation, setActiveLocation] = useState<string>(locations[0]?.id || "");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!property.lat || !property.lng) return;

    locations.forEach(async (loc) => {
      try {
        const res = await fetch("/api/commute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originLat: property.lat,
            originLng: property.lng,
            destLat: loc.lat,
            destLng: loc.lng,
          }),
        });
        const data = await res.json();
        setCommutes((prev) => ({ ...prev, [loc.id]: data }));
      } catch {
        setCommutes((prev) => ({ ...prev, [loc.id]: null }));
      }
    });
  }, [property, locations]);

  // Position card so it doesn't overflow viewport
  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 1000,
    left: Math.min(position.x + 16, window.innerWidth - 380),
    top: Math.min(position.y - 20, window.innerHeight - 500),
  };

  const activeCommute = commutes[activeLocation];
  const activeTransit = activeCommute?.transit;
  const activeWalking = activeCommute?.walking;
  const activeLoc = locations.find((l) => l.id === activeLocation);

  const transitSteps = activeTransit?.steps?.filter((s) => s.instruction) || [];

  return (
    <div
      ref={cardRef}
      style={style}
      className="commute-card"
      onMouseLeave={onClose}
    >
      {/* Header */}
      <div className="card-header">
        <div className="property-name">
          <span className="pin-icon">📍</span>
          <div>
            <div className="prop-title">{property.name || "Property"}</div>
            <div className="prop-address">{property.address}</div>
          </div>
        </div>
        {property.rent && (
          <div className="prop-rent">{property.rent}</div>
        )}
      </div>

      {/* Location tabs */}
      <div className="location-tabs">
        {locations.map((loc) => {
          const info = commutes[loc.id];
          const loaded = info !== undefined;
          const duration = info?.transit?.duration || info?.walking?.duration;
          return (
            <button
              key={loc.id}
              className={`loc-tab ${activeLocation === loc.id ? "active" : ""}`}
              style={{
                borderBottomColor: activeLocation === loc.id ? loc.color : "transparent",
              }}
              onClick={() => setActiveLocation(loc.id)}
            >
              <span className="loc-dot" style={{ background: loc.color }} />
              <span className="loc-name">{loc.label}</span>
              {loaded && duration ? (
                <span className="loc-time">{duration}</span>
              ) : !loaded ? (
                <span className="loc-loading">...</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Commute details */}
      <div className="commute-details">
        {!activeCommute ? (
          <div className="loading-state">
            <div className="pulse-dots">
              <span /><span /><span />
            </div>
            <p>Fetching commute to {activeLoc?.name}…</p>
          </div>
        ) : (
          <>
            {/* Mode summary */}
            <div className="mode-summary">
              {activeTransit && (
                <div className="mode-chip transit">
                  <span>🚇</span>
                  <div>
                    <div className="mode-time">{activeTransit.duration}</div>
                    <div className="mode-label">by transit</div>
                  </div>
                </div>
              )}
              {activeWalking && (
                <div className="mode-chip walk">
                  <span>🚶</span>
                  <div>
                    <div className="mode-time">{activeWalking.duration}</div>
                    <div className="mode-label">walking</div>
                  </div>
                </div>
              )}
            </div>

            {/* Route steps */}
            {transitSteps.length > 0 && (
              <div className="route-steps">
                <div className="steps-label">Route via transit</div>
                {transitSteps.slice(0, 6).map((step, i) => (
                  <div key={i} className="step">
                    <div className="step-icon">
                      {step.transitVehicle === "SUBWAY" || step.transitVehicle === "HEAVY_RAIL"
                        ? "🚇"
                        : step.transitVehicle === "BUS"
                        ? "🚌"
                        : "🚶"}
                    </div>
                    <div className="step-content">
                      <div className="step-instruction">{step.instruction}</div>
                      {step.transitLine && (
                        <div className="step-line">
                          Line: <strong>{step.transitLine}</strong>
                          {step.departureStop && ` from ${step.departureStop}`}
                          {step.arrivalStop && ` → ${step.arrivalStop}`}
                        </div>
                      )}
                    </div>
                    <div className="step-dur">{step.duration}</div>
                  </div>
                ))}
              </div>
            )}

            {!activeTransit && !activeWalking && (
              <div className="no-route">No route data available</div>
            )}
          </>
        )}
      </div>

      {/* Footer link */}
      <a href={property.url} target="_blank" rel="noopener noreferrer" className="card-footer-link">
        View full listing ↗
      </a>

      <style jsx>{`
        .commute-card {
          width: 360px;
          background: #0F1923;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          font-family: 'Inter', 'Sora', sans-serif;
          color: #F0EDE6;
          overflow: hidden;
          animation: slideIn 0.18s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-header {
          padding: 14px 16px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .property-name { display: flex; gap: 8px; align-items: flex-start; flex: 1; }
        .pin-icon { font-size: 18px; margin-top: 1px; }
        .prop-title { font-size: 13px; font-weight: 600; color: #F0EDE6; line-height: 1.3; }
        .prop-address { font-size: 11px; color: rgba(240,237,230,0.55); margin-top: 2px; line-height: 1.4; }
        .prop-rent { font-size: 13px; font-weight: 700; color: #C9A84C; white-space: nowrap; }

        .location-tabs {
          display: flex;
          overflow-x: auto;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 0 4px;
          scrollbar-width: none;
        }
        .location-tabs::-webkit-scrollbar { display: none; }
        .loc-tab {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 10px;
          font-size: 11px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(240,237,230,0.5);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .loc-tab.active { color: #F0EDE6; }
        .loc-tab:hover { color: rgba(240,237,230,0.8); }
        .loc-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .loc-name { font-weight: 500; }
        .loc-time { font-size: 10px; color: #C9A84C; font-weight: 600; }
        .loc-loading { font-size: 10px; color: rgba(240,237,230,0.3); }

        .commute-details {
          padding: 12px 16px;
          min-height: 160px;
          max-height: 280px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 120px;
          gap: 12px;
          color: rgba(240,237,230,0.4);
          font-size: 12px;
        }
        .pulse-dots { display: flex; gap: 6px; }
        .pulse-dots span {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(240,237,230,0.3);
          animation: pulse 1.2s ease-in-out infinite;
        }
        .pulse-dots span:nth-child(2) { animation-delay: 0.2s; }
        .pulse-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse { 0%,80%,100% { opacity: 0.3; } 40% { opacity: 1; } }

        .mode-summary { display: flex; gap: 10px; margin-bottom: 12px; }
        .mode-chip {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 12px;
        }
        .mode-chip.transit { background: rgba(230,57,70,0.15); border: 1px solid rgba(230,57,70,0.2); }
        .mode-chip.walk { background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); }
        .mode-chip span { font-size: 20px; }
        .mode-time { font-weight: 700; font-size: 14px; color: #F0EDE6; }
        .mode-label { font-size: 10px; color: rgba(240,237,230,0.45); text-transform: uppercase; letter-spacing: 0.05em; }

        .steps-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(240,237,230,0.35); margin-bottom: 8px; }
        .route-steps { display: flex; flex-direction: column; gap: 6px; }
        .step {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          padding: 6px 8px;
          border-radius: 6px;
          background: rgba(255,255,255,0.03);
        }
        .step-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .step-content { flex: 1; min-width: 0; }
        .step-instruction { font-size: 11px; color: rgba(240,237,230,0.8); line-height: 1.35; }
        .step-line { font-size: 10px; color: rgba(240,237,230,0.45); margin-top: 2px; }
        .step-dur { font-size: 10px; color: #C9A84C; white-space: nowrap; font-weight: 600; flex-shrink: 0; }

        .no-route { text-align: center; color: rgba(240,237,230,0.35); font-size: 12px; padding: 20px 0; }
        .card-footer-link {
          display: block;
          text-align: center;
          padding: 10px;
          font-size: 11px;
          color: rgba(240,237,230,0.4);
          text-decoration: none;
          border-top: 1px solid rgba(255,255,255,0.06);
          transition: color 0.15s;
        }
        .card-footer-link:hover { color: #C9A84C; }
      `}</style>
    </div>
  );
}
