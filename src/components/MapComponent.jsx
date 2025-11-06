import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import L from 'leaflet';

// Fix for default markers in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiMwMDU3QjciIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiMwMDU3QjciIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K',
  shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjIwLjUiIGN5PSI0MSIgcng9IjE4LjUiIHJ5PSI1LjUiIGZpbGw9InJnYmEoMCwwLDAsMC4yKSIvPgo8L3N2Zz4K',
});

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const { 
    userLocation, 
    homeLocation, 
    nearbySensors, 
    currentStatus,
    setMap,
    calculateDistance
  } = useAppStore();

  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [14.5995, 120.9842], // Manila default
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: ''
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    mapRef.current = map;
    setMap(map);
    setMapLoaded(true);

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMap(null);
      }
    };
  }, [setMap]);

  // Update map center when user location changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (homeLocation) {
      mapRef.current.setView([homeLocation.lat, homeLocation.lng], 15);
      return;
    }

    if (userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    }
  }, [homeLocation, userLocation, mapLoaded]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add home location marker
    if (homeLocation) {
      const homeIcon = L.divIcon({
        html: `<div class="w-6 h-6 bg-primary-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
                 <div class="w-2 h-2 bg-white rounded-full"></div>
               </div>`,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const homeMarker = L.marker([homeLocation.lat, homeLocation.lng], { icon: homeIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">Your Home</h3>
            <p class="text-xs text-gray-600">Primary location for monitoring</p>
          </div>
        `);

      markersRef.current.push(homeMarker);
    }

    // Add sensor markers
    nearbySensors.forEach(sensor => {
      const getSensorColor = (type) => {
        switch (type) {
          case 'water_level':
            return sensor.reading_value > 2 ? '#DC2626' : '#16A34A';
          case 'wind_speed':
            return sensor.reading_value > 30 ? '#DC2626' : '#16A34A';
          case 'camera':
            return '#0057B7';
          default:
            return '#6B7280';
        }
      };

      const getSensorIcon = (type) => {
        switch (type) {
          case 'water_level':
            return '🌊';
          case 'wind_speed':
            return '💨';
          case 'camera':
            return '📹';
          default:
            return '📊';
        }
      };

      const sensorColor = getSensorColor(sensor.sensor_type);
      const sensorIcon = getSensorIcon(sensor.sensor_type);

      const sensorMarker = L.divIcon({
        html: `<div class="w-8 h-8 bg-white border-2 rounded-full shadow-lg flex items-center justify-center text-sm" style="border-color: ${sensorColor}">
                 <span>${sensorIcon}</span>
               </div>`,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([sensor.location.lat, sensor.location.lng], { icon: sensorMarker })
        .addTo(mapRef.current)
        .bindPopup(`
          <div class="p-3 min-w-48">
            <h3 class="font-semibold text-sm mb-2">${sensor.sensor_id}</h3>
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="text-xs text-gray-600">Type:</span>
                <span class="text-xs font-medium">${sensor.sensor_type.replace('_', ' ')}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-xs text-gray-600">Reading:</span>
                <span class="text-xs font-medium" style="color: ${sensorColor}">
                  ${sensor.reading_value}${sensor.sensor_type === 'water_level' ? 'm' : sensor.sensor_type === 'wind_speed' ? 'km/h' : ''}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-xs text-gray-600">Status:</span>
                <span class="text-xs font-medium ${sensor.reading_value > (sensor.sensor_type === 'water_level' ? 2 : 30) ? 'text-red-600' : 'text-green-600'}">
                  ${sensor.reading_value > (sensor.sensor_type === 'water_level' ? 2 : 30) ? 'WARNING' : 'NORMAL'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-xs text-gray-600">Last Update:</span>
                <span class="text-xs font-medium">${new Date(sensor.last_updated).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        `);

      markersRef.current.push(marker);
    });

    // Add threat polygon if exists
    if (currentStatus === 'danger') {
      // This would come from the threatData in a real implementation
      const threatLatLngs = [
        [14.5995, 120.9842],
        [14.6095, 120.9942],
        [14.5895, 120.9942],
        [14.5895, 120.9742],
      ];

      const threatPolygon = L.polygon(threatLatLngs, {
        color: '#DC2626',
        fillColor: '#FEE2E2',
        fillOpacity: 0.6,
        weight: 3,
        dashArray: '5, 5'
      }).addTo(mapRef.current);

      threatPolygon.bindPopup(`
        <div class="p-3">
          <h3 class="font-semibold text-red-600 mb-2">⚠️ Flood Warning</h3>
          <p class="text-sm text-gray-600">
            Floodwater detected in this area. Stay away from flood zones and evacuate if necessary.
          </p>
        </div>
      `);

      markersRef.current.push(threatPolygon);
    }

  }, [nearbySensors, currentStatus, mapLoaded]);

  return (
    <div className="relative h-full">
      <div 
        ref={mapContainerRef} 
        className="h-full w-full"
        style={{ minHeight: '100vh' }}
      />
      
      {/* Map Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full loading-spinner mx-auto mb-4" />
            <p className="small text-neutral-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-button p-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse" />
            <span className="small font-medium text-neutral-700">
              {nearbySensors.length} sensors active
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-button p-3 shadow-lg max-w-48">
          <h4 className="small font-semibold text-neutral-700 mb-2">Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full" />
              <span className="small text-neutral-600">Your Home</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success-500 rounded-full" />
              <span className="small text-neutral-600">Normal Sensors</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-danger-500 rounded-full" />
              <span className="small text-neutral-600">Warning Sensors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Location Info */}
      {userLocation && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-button p-3 shadow-lg max-w-48">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              <span className="small font-semibold text-neutral-700">Your Location</span>
            </div>
            <p className="small text-neutral-600">
              {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </p>
            <p className="small text-neutral-500">
              Acc: ±{Math.round(userLocation.accuracy)}m
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;