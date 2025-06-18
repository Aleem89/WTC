"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
mapboxgl.accessToken = mapboxToken;

// Time range options
const TIME_RANGES = {
  "1M": "1 Month",
  "3M": "3 Months",
  "6M": "6 Months",
  "1Y": "1 Year",
};

function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-97.32);
  const [lat, setLat] = useState(32.72541);
  const [zoom, setZoom] = useState(11);
  const [timeRange, setTimeRange] = useState("3M");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch crime data from API
  const fetchCrimeData = useCallback(async (range) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/crimes?timeRange=${range}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching crime data:", err);
      setError("Failed to load crime data");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to update map data
  const updateMapData = useCallback(
    async (range) => {
      if (!map.current) return;

      const crimeData = await fetchCrimeData(range);
      if (!crimeData) return;

      // Update the data source
      if (map.current.getSource("crimes")) {
        map.current.getSource("crimes").setData(crimeData);
      }
    },
    [fetchCrimeData],
  );

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on("load", async () => {
      // Initial data load
      const initialData = await fetchCrimeData(timeRange);

      if (initialData) {
        map.current.addSource("crimes", {
          type: "geojson",
          data: initialData,
        });

        map.current.addLayer({
          id: "crime-points",
          type: "circle",
          source: "crimes",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 15, 8],
            "circle-color": [
              "match",
              ["get", "Nature Of Call"],
              "THEFT RECYCLE",
              "#2ecc71",
              "THEFT",
              "#2ecc71",
              "BURGLARY COMMERCIAL",
              "#e74c3c",
              "BURGLARY",
              "#e74c3c",
              "ASSAULT",
              "#e67e22",
              "ROBBERY",
              "#9b59b6",
              "#3498db", // default color
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.8,
          },
        });

        // Add popup on click
        map.current.on("click", "crime-points", (e) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const properties = e.features[0].properties;

          // Format the date for display
          const formatDate = (dateString) => {
            if (!dateString) return "N/A";
            try {
              return new Date(dateString).toLocaleDateString();
            } catch {
              return dateString;
            }
          };

          const popupContent = `
            <div style="padding: 8px; color: #1a1a1a; font-family: system-ui, -apple-system, sans-serif;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: #000000; font-size: 14px;">${properties.Description || "No description available"}</h3>
              <p style="margin: 4px 0; color: #333333; font-size: 12px;"><strong style="color: #000000;">Case:</strong> ${properties["Case Number"] || "N/A"}</p>
              <p style="margin: 4px 0; color: #333333; font-size: 12px;"><strong style="color: #000000;">Date:</strong> ${formatDate(properties["Reported Date"])}</p>
              <p style="margin: 4px 0; color: #333333; font-size: 12px;"><strong style="color: #000000;">Location:</strong> ${properties["Block Address"] || "N/A"}</p>
              <p style="margin: 4px 0; color: #333333; font-size: 12px;"><strong style="color: #000000;">Nature:</strong> ${properties["Nature Of Call"] || "N/A"}</p>
              <p style="margin: 4px 0; color: #333333; font-size: 12px;"><strong style="color: #000000;">City:</strong> ${properties["City"] || "N/A"}</p>
            </div>
          `;

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map.current);
        });

        map.current.on("mouseenter", "crime-points", () => {
          map.current.getCanvas().style.cursor = "pointer";
        });

        map.current.on("mouseleave", "crime-points", () => {
          map.current.getCanvas().style.cursor = "";
        });
      }
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, [lng, lat, zoom, timeRange, fetchCrimeData]);

  // Update data when time range changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      updateMapData(timeRange);
    }
  }, [timeRange, updateMapData]);

  return (
    <div className="relative">
      <div className="absolute top-0 left-0 bg-black bg-opacity-70 text-white p-2 z-10 m-2 rounded flex flex-col gap-2">
        <div>
          Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
        </div>
        <div className="flex gap-2 items-center">
          {Object.entries(TIME_RANGES).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              disabled={loading}
              className={`px-3 py-1 rounded transition-colors ${
                timeRange === value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 hover:bg-gray-600"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {label}
            </button>
          ))}
          {loading && <div className="text-sm text-gray-300">Loading...</div>}
        </div>
        {error && (
          <div className="text-sm text-red-400 bg-red-900 bg-opacity-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
export default Map;
