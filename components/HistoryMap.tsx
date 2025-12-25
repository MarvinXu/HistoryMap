import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HistoricalEvent } from '../types';

interface HistoryMapProps {
  savedEvents: HistoricalEvent[];
  selectedEvent: HistoricalEvent | null;
  onSelectEvent: (event: HistoricalEvent) => void;
}

const HistoryMap: React.FC<HistoryMapProps> = ({ savedEvents, selectedEvent, onSelectEvent }) => {
  const mapRef = useRef<L.Map | null>(null);
  
  // Use LayerGroups to manage markers efficiently without full re-renders
  const savedLayerRef = useRef<L.LayerGroup | null>(null);

  // Cache references to saved markers by ID for quick access during selection
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map-container', { 
        zoomControl: false,
        attributionControl: false
      }).setView([35.8617, 104.1954], 4);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapRef.current);
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      L.control.attribution({ position: 'bottomright' }).addTo(mapRef.current);

      // Initialize layer for saved markers
      savedLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update saved markers
  useEffect(() => {
    if (!mapRef.current || !savedLayerRef.current) return;

    // Clear old saved markers using LayerGroup
    savedLayerRef.current.clearLayers();
    markersRef.current = {};

    savedEvents.forEach(event => {
      const icon = L.divIcon({
        className: 'bg-transparent border-none', // Wrapper is invisible
        html: `<div class="w-3 h-3 bg-indigo-600 border-2 border-white rounded-full shadow-md transition-transform hover:scale-125 cursor-pointer"></div>`,
        iconSize: [12, 12], // Wrapper size matches content
        iconAnchor: [6, 6], // Center of the 16x16 box
        popupAnchor: [0, -10]
      });
      const marker = L.marker([event.location.lat, event.location.lng], { icon })
      .addTo(savedLayerRef.current)
      .bindPopup(`<b>${event.title}</b><br><small>${event.dateStr}</small>`, {autoPan: false});
      
      marker.on('click', () => onSelectEvent(event));
      markersRef.current[event.id] = marker;
    });
  }, [savedEvents, onSelectEvent]);

  // Handle selected event localization
  useEffect(() => {
    if (!mapRef.current || !selectedEvent) return;

    // Fly to the location
    mapRef.current.flyTo(
      [selectedEvent.location.lat, selectedEvent.location.lng], 
      6, 
      { duration: 1, easeLinearity: 0.1 }
    );

    // If it's already saved, open its existing popup with delay
    const marker = markersRef.current[selectedEvent.id];
    if (marker) {
      setTimeout(() => marker.openPopup(), 100);
    }
  }, [selectedEvent, savedEvents]);

  return <div id="map-container" className="h-full w-full bg-slate-100" />;
};

export default HistoryMap;