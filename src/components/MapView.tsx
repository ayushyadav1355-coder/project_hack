import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { DayItinerary } from '../types/travel';
import { MapPin, Navigation, Calendar, Layers } from 'lucide-react';

interface MapViewProps {
  itinerary: DayItinerary[];
}

export const MapView: React.FC<MapViewProps> = ({ itinerary }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedDayNumber, setSelectedDayNumber] = useState<number | 'all'>('all');

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center (Tokyo coordinates fallback)
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([35.6895, 139.6917], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // ResizeObserver to handle layout container changes
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Polylines when selectedDay or itinerary changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Filter activities by day
    const daysToShow = selectedDayNumber === 'all'
      ? itinerary
      : itinerary.filter(d => d.dayNumber === selectedDayNumber);

    const latLngBounds: [number, number][] = [];

    // Distinct color palette per day
    const DAY_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

    daysToShow.forEach((day) => {
      const dayColor = DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];
      const dayCoordinates: [number, number][] = [];

      day.activities.forEach((act, actIndex) => {
        if (act.coordinates && typeof act.coordinates.lat === 'number' && typeof act.coordinates.lng === 'number') {
          const { lat, lng } = act.coordinates;
          dayCoordinates.push([lat, lng]);
          latLngBounds.push([lat, lng]);

          // Create clean HTML DivIcon for the stop marker
          const markerHtml = `
            <div style="
              background-color: ${dayColor};
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 700;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.25);
            ">
              ${actIndex + 1}
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-map-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
          });

          const popupContent = `
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 180px;">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px; font-size: 13px;">
                ${act.name}
              </div>
              <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
                Day ${day.dayNumber} • ${act.startTime} – ${act.endTime}
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px; color: #334155;">
                <span style="background: #eff6ff; color: #1d4ed8; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
                  ${act.category}
                </span>
                <span style="font-weight: 700; font-size: 11px;">
                  ${act.currency} ${act.estimatedCost}
                </span>
              </div>
            </div>
          `;

          const marker = L.marker([lat, lng], { icon: customIcon })
            .bindPopup(popupContent);

          layerGroup.addLayer(marker);
        }
      });

      // Draw polyline route connecting sequential stops
      if (dayCoordinates.length > 1) {
        const routeLine = L.polyline(dayCoordinates, {
          color: dayColor,
          weight: 3.5,
          opacity: 0.85,
          dashArray: selectedDayNumber === 'all' ? '6, 6' : undefined
        });
        layerGroup.addLayer(routeLine);
      }
    });

    // Auto-fit map to show all placed pins
    if (latLngBounds.length > 0) {
      map.fitBounds(L.latLngBounds(latLngBounds), {
        padding: [40, 40],
        maxZoom: 14
      });
    }
  }, [itinerary, selectedDayNumber]);

  return (
    <div className="space-y-4">
      
      {/* Map Filter Controls Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700">Display Routes:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedDayNumber('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedDayNumber === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Days
          </button>

          {itinerary.map(day => (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayNumber(day.dayNumber)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedDayNumber === day.dayNumber
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative">
        <div 
          id="leaflet-map-canvas" 
          ref={mapContainerRef} 
          className="w-full h-[520px] z-10"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-2 rounded-lg shadow-sm text-[11px] text-slate-600 space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-blue-600" />
            Sequential Route Stops
          </div>
          <p className="text-slate-500">Click any numbered marker for activity schedule and budget details.</p>
        </div>
      </div>

    </div>
  );
};
