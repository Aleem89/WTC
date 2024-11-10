'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
mapboxgl.accessToken = mapboxToken;

function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-97.32);
  const [lat, setLat] = useState(32.72541);
  const [zoom, setZoom] = useState(11);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: zoom
    });

    // Add crime data after map loads
    map.current.on('load', () => {
      // Add the data source
      map.current.addSource('crimes', {
        type: 'geojson',
        data: '/cleaned_crime_data.geojson'
      });

      

      // Add a layer showing the crime points
      map.current.addLayer({
        id: 'crime-points',
        type: 'circle',
        source: 'crimes',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 4,
            15, 8
          ],
          'circle-color': [
            'match',
            ['get', 'Nature Of Call'],
            'THEFT', '#2ecc71',          // Green for theft
            'BURGLARY', '#e74c3c',       // Red for burglary
            'ASSAULT', '#e67e22',        // Orange for assault
            'ROBBERY', '#9b59b6',        // Purple for robbery
            '#3498db'                    // Default blue for others
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        }
      });

      // Add popup on click
      map.current.on('click', 'crime-points', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;

        // Format the popup content
        const popupContent = `
        <div class="p-2">
          <h3 class="font-bold mb-2">${properties.Description || 'No description available'}</h3>
          <p><strong>Case:</strong> ${properties['Case Number'] || 'N/A'}</p>
          <p><strong>Date:</strong> ${properties['Reported Date'] || 'N/A'}</p>
          <p><strong>Location:</strong> ${properties['Block Address'] || 'N/A'}</p>
          <p><strong>Nature:</strong> ${properties['Nature Of Call'] || 'N/A'}</p>
        </div>
      `;

        // Create and show the popup
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map.current);
      });

      // Change cursor to pointer when hovering over crime points
      map.current.on('mouseenter', 'crime-points', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'crime-points', () => {
        map.current.getCanvas().style.cursor = '';
      });
    });

    // Optional: Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Optional: Track map movement
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, []);

  // Optional: Add coordinates display
  return (
    <div className="relative">
      <div className="absolute top-0 left-0 bg-black bg-opacity-70 text-white p-2 z-10 m-2 rounded">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default Map;