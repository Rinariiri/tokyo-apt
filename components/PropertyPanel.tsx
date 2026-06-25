"use client";

import { useState } from "react";
import { Property } from "@/types";

interface PropertyPanelProps {
  properties: Property[];
  onAdd: (url: string) => void;
  onRemove: (id: string) => void;
  onHover: (property: Property | null, event: React.MouseEvent | null) => void;
  hoveredId: string | null;
}

export default function PropertyPanel({
  properties,
  onAdd,
  onRemove,
  onHover,
  hoveredId,
}: PropertyPanelProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    const url = inputUrl.trim();
    if (!url) return;
    setAdding(true);
    onAdd(url);
    setInputUrl("");
    setAdding(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="logo">
          <span className="logo-icon">🗼</span>
          <div>
            <div className="logo-title">Tokyo Apt</div>
            <div className="logo-sub">Apartment Hunter</div>
          </div>
        </div>
      </div>

      <div className="input-section">
        <div className="input-label">Add a property listing</div>
        <div className="input-row">
          <input
            type="url"
            placeholder="Paste listing URL…"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKey}
            className="url-input"
          />
          <button
            onClick={handleAdd}
            disabled={!inputUrl.trim() || adding}
            className="add-btn"
          >
            {adding ? "…" : "+"}
          </button>
        </div>
        <div className="input-hint">Supports arealty.jp, suumo.jp, and more</div>
      </div>

      <div className="properties-list">
        {properties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <div className="empty-text">No properties yet</div>
            <div className="empty-sub">Paste a listing URL above to get started</div>
          </div>
        ) : (
          properties.map((p) => (
            <div
              key={p.id}
              className={`property-item ${hoveredId === p.id ? "hovered" : ""} ${p.error ? "has-error" : ""}`}
              onMouseEnter={(e) => !p.loading && !p.error && onHover(p, e)}
              onMouseLeave={() => onHover(null, null)}
            >
              <div className="prop-content">
                {p.loading ? (
                  <div className="prop-loading">
                    <div className="spinner" />
                    <span>Fetching property info…</span>
                  </div>
                ) : p.error ? (
                  <div className="prop-error">
                    <div className="error-icon">⚠️</div>
                    <div>
                      <div className="error-msg">Could not load listing</div>
                      <div className="error-url">{p.url}</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="prop-header">
                      <div className="prop-name">{p.name || "Property"}</div>
                      {!p.lat && (
                        <span className="no-geocode" title="Could not place on map">📍?</span>
                      )}
                    </div>
                    <div className="prop-address">{p.address}</div>
                    <div className="prop-meta">
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="prop-link" onClick={(e) => e.stopPropagation()}>
                        View listing ↗
                      </a>
                      {p.rent && <span className="prop-rent">{p.rent}</span>}
                    </div>
                    {hoveredId === p.id && (
                      <div className="hover-hint">Showing commutes…</div>
                    )}
                  </>
                )}
              </div>
              <button
                className="remove-btn"
                onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0F1923;
          overflow: hidden;
        }
        .panel-header {
          padding: 20px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon { font-size: 26px; }
        .logo-title { font-size: 18px; font-weight: 700; color: #F0EDE6; letter-spacing: -0.02em; }
        .logo-sub { font-size: 11px; color: rgba(240,237,230,0.4); text-transform: uppercase; letter-spacing: 0.08em; }

        .input-section { padding: 16px 16px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .input-label { font-size: 11px; color: rgba(240,237,230,0.45); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
        .input-row { display: flex; gap: 8px; }
        .url-input {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 12px;
          color: #F0EDE6;
          outline: none;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .url-input::placeholder { color: rgba(240,237,230,0.3); }
        .url-input:focus { border-color: rgba(230,57,70,0.5); }
        .add-btn {
          width: 36px;
          height: 36px;
          background: #E63946;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          flex-shrink: 0;
        }
        .add-btn:hover:not(:disabled) { background: #c8303d; transform: scale(1.05); }
        .add-btn:disabled { background: rgba(230,57,70,0.3); cursor: not-allowed; }
        .input-hint { font-size: 10px; color: rgba(240,237,230,0.25); margin-top: 5px; }

        .properties-list { flex: 1; overflow-y: auto; padding: 8px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
        .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: 200px; text-align: center; padding: 20px;
        }
        .empty-icon { font-size: 36px; margin-bottom: 12px; }
        .empty-text { font-size: 14px; font-weight: 600; color: rgba(240,237,230,0.5); }
        .empty-sub { font-size: 11px; color: rgba(240,237,230,0.3); margin-top: 4px; }

        .property-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 8px;
          cursor: default;
          transition: background 0.15s, border-color 0.15s;
          background: rgba(255,255,255,0.02);
        }
        .property-item:hover:not(.has-error) { background: rgba(255,255,255,0.05); border-color: rgba(230,57,70,0.2); }
        .property-item.hovered { background: rgba(230,57,70,0.08); border-color: rgba(230,57,70,0.3); }
        .property-item.has-error { opacity: 0.7; }
        .prop-content { flex: 1; min-width: 0; }
        .prop-loading { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(240,237,230,0.4); }
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #E63946; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .prop-error { display: flex; gap: 8px; align-items: flex-start; }
        .error-icon { font-size: 16px; }
        .error-msg { font-size: 12px; color: #E63946; }
        .error-url { font-size: 10px; color: rgba(240,237,230,0.3); word-break: break-all; margin-top: 2px; }

        .prop-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 4px; }
        .prop-name { font-size: 13px; font-weight: 600; color: #F0EDE6; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .no-geocode { font-size: 12px; opacity: 0.5; flex-shrink: 0; }
        .prop-address { font-size: 11px; color: rgba(240,237,230,0.5); margin-top: 3px; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .prop-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
        .prop-link { font-size: 10px; color: rgba(240,237,230,0.35); text-decoration: none; }
        .prop-link:hover { color: #C9A84C; }
        .prop-rent { font-size: 11px; font-weight: 700; color: #C9A84C; }
        .hover-hint { font-size: 10px; color: rgba(230,57,70,0.7); margin-top: 4px; }
        .remove-btn {
          background: none; border: none; color: rgba(240,237,230,0.2); font-size: 18px;
          cursor: pointer; padding: 0 4px; line-height: 1; flex-shrink: 0; margin-top: -2px;
          transition: color 0.15s;
        }
        .remove-btn:hover { color: #E63946; }
      `}</style>
    </div>
  );
}
