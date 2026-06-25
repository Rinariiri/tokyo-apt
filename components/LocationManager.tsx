"use client";

import { useState } from "react";
import { Location } from "@/types";

interface LocationManagerProps {
  locations: Location[];
  onAdd: (location: Omit<Location, "id">) => void;
  onRemove: (id: string) => void;
}

const COLORS = ["#E63946", "#C9A84C", "#4ECDC4", "#9B59B6", "#E67E22", "#27AE60", "#3498DB"];

export default function LocationManager({ locations, onAdd, onRemove }: LocationManagerProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [color, setColor] = useState(COLORS[0]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setGeocoding(true);

    try {
      // Geocode via our scrape endpoint approach - use a proxy
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(name + " Tokyo Japan")}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&language=en&region=JP`
      );
      const data = await res.json();

      if (data.results?.[0]) {
        const loc = data.results[0].geometry.location;
        onAdd({
          name: data.results[0].formatted_address,
          label: label || name,
          lat: loc.lat,
          lng: loc.lng,
          color,
        });
        setName("");
        setLabel("");
        setAdding(false);
      } else {
        alert("Could not find location. Try a more specific name.");
      }
    } catch {
      alert("Geocoding failed. Check your API key.");
    }
    setGeocoding(false);
  };

  return (
    <div className="loc-manager">
      <div className="section-label">📌 Key Locations</div>

      <div className="loc-list">
        {locations.map((loc) => (
          <div key={loc.id} className="loc-item">
            <span className="loc-dot" style={{ background: loc.color }} />
            <div className="loc-info">
              <div className="loc-label">{loc.label}</div>
              <div className="loc-name">{loc.name}</div>
            </div>
            <button className="loc-remove" onClick={() => onRemove(loc.id)}>×</button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="add-form">
          <input
            placeholder="Place name (e.g. Shinjuku Station)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
          />
          <input
            placeholder="Short label (e.g. Work)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="form-input"
          />
          <div className="color-row">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`color-btn ${color === c ? "selected" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setAdding(false)}>Cancel</button>
            <button className="confirm-btn" onClick={handleAdd} disabled={!name.trim() || geocoding}>
              {geocoding ? "Finding…" : "Add"}
            </button>
          </div>
        </div>
      ) : (
        <button className="add-loc-btn" onClick={() => setAdding(true)}>
          + Add location
        </button>
      )}

      <style jsx>{`
        .loc-manager { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(240,237,230,0.35); margin-bottom: 10px; }
        .loc-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
        .loc-item { display: flex; align-items: flex-start; gap: 8px; padding: 7px 8px; border-radius: 7px; background: rgba(255,255,255,0.03); }
        .loc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
        .loc-info { flex: 1; min-width: 0; }
        .loc-label { font-size: 12px; font-weight: 600; color: #F0EDE6; }
        .loc-name { font-size: 10px; color: rgba(240,237,230,0.4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .loc-remove { background: none; border: none; color: rgba(240,237,230,0.2); font-size: 16px; cursor: pointer; padding: 0; transition: color 0.15s; }
        .loc-remove:hover { color: #E63946; }
        .add-loc-btn { width: 100%; padding: 7px; background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.12); border-radius: 7px; color: rgba(240,237,230,0.4); font-size: 11px; cursor: pointer; transition: all 0.15s; }
        .add-loc-btn:hover { background: rgba(255,255,255,0.07); color: rgba(240,237,230,0.7); }
        .add-form { display: flex; flex-direction: column; gap: 6px; }
        .form-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 7px 10px; font-size: 11px; color: #F0EDE6; outline: none; font-family: inherit; }
        .form-input:focus { border-color: rgba(230,57,70,0.4); }
        .form-input::placeholder { color: rgba(240,237,230,0.3); }
        .color-row { display: flex; gap: 6px; }
        .color-btn { width: 20px; height: 20px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.1s; }
        .color-btn.selected { border-color: white; transform: scale(1.2); }
        .form-actions { display: flex; gap: 6px; }
        .cancel-btn { flex: 1; padding: 6px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: rgba(240,237,230,0.5); font-size: 11px; cursor: pointer; }
        .confirm-btn { flex: 1; padding: 6px; background: #E63946; border: none; border-radius: 6px; color: white; font-size: 11px; cursor: pointer; font-weight: 600; }
        .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
