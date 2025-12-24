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
  const markersRef = useRef<{ [key: string]: L.CircleMarker }>({});
  const tempMarkerRef = useRef<L.CircleMarker | null>(null);

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
    if (!mapRef.current) return;

    // Clear old saved markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    savedEvents.forEach(event => {
      const marker = L.circleMarker([event.location.lat, event.location.lng], {
        radius: 9,
        fillColor: "#4f46e5", // Indigo
        color: "#fff",
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
        className: 'saved-marker-pulse'
      })
      .addTo(mapRef.current!)
      .bindPopup(`<b>${event.title}</b><br><small>${event.dateStr}</small>`);
      
      marker.on('click', () => onSelectEvent(event));
      markersRef.current[event.id] = marker;
    });
  }, [savedEvents, onSelectEvent]);

  // Handle selected event localization (both saved and search results)
  useEffect(() => {
    if (!mapRef.current || !selectedEvent) return;

    // Fly to the location
    mapRef.current.flyTo(
      [selectedEvent.location.lat, selectedEvent.location.lng], 
      6, 
      { duration: 1.5, easeLinearity: 0.1 }
    );

    // If it's a search result (not in savedEvents), show a temporary amber marker
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }

    const isSaved = savedEvents.some(e => e.id === selectedEvent.id);
    if (!isSaved) {
      tempMarkerRef.current = L.circleMarker([selectedEvent.location.lat, selectedEvent.location.lng], {
        radius: 12,
        fillColor: "#f59e0b", // Amber/Orange
        color: "#fff",
        weight: 4,
        opacity: 1,
        fillOpacity: 1,
        className: 'animate-pulse'
      })
      .addTo(mapRef.current!)
      .bindPopup(`<b>${selectedEvent.title} (预览)</b>`);
      
      tempMarkerRef.current.openPopup();
    } else {
      // If it's already saved, open its existing popup if available
      const marker = markersRef.current[selectedEvent.id];
      if (marker) marker.openPopup();
    }
  }, [selectedEvent, savedEvents]);

  return <div id="map-container" className="h-full w-full bg-slate-100" />;
};

export default HistoryMap;
