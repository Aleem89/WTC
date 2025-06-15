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
  const [timeRange, setTimeRange] = useState("3M"); // Default to 3 months

  // Function to calculate the date range based on selected filter
  const getDateRange = useCallback((range) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case "1M":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 3);
    }

    return [startDate, endDate];
  }, []);

  // Function to update map filter based on time range
  const updateTimeFilter = useCallback(() => {
    if (!map.current) return;

    const [startDate, endDate] = getDateRange(timeRange);

    // Convert dates to ISO string format to match your data
    const filterExpression = [
      "all",
      [">=", ["get", "Isodate"], startDate.toISOString()],
      ["<=", ["get", "Isodate"], endDate.toISOString()],
    ];

    if (map.current.getLayer("crime-points")) {
      map.current.setFilter("crime-points", filterExpression);
    }
  }, [timeRange, getDateRange]);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on("load", () => {
      map.current.addSource("crimes", {
        type: "geojson",
        data: "/cleaned_crime_data.geojson",
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
            "THEFT",
            "#2ecc71",
            "BURGLARY",
            "#e74c3c",
            "ASSAULT",
            "#e67e22",
            "ROBBERY",
            "#9b59b6",
            "#3498db",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.8,
        },
      });

      // Apply initial time filter
      updateTimeFilter();

      // Add popup and mouse event handlers (unchanged)
      map.current.on("click", "crime-points", (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;

        const popupContent = `
          <div style="padding: 8px; color: #1a1a1a; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="font-weight: bold; margin-bottom: 8px; color: #000000; font-size: 14px;">${properties.Description || "No description available"}</h3>
            <p style="margin: 4px 0; color: #333333; font-size: 12px;"><strong style="color: #000000;">Case:</strong> ${properties["Case Number"] || "N/A"}</p>
            <p style="margin: 4px 0; color: #333333; font-size: 12px;"><strong style="color: #000000;">Date:</strong> ${properties["Reported Date"] || "N/A"}</p>
            <p style="margin: 4px 0; color: #333333; font-size: 12px;"><strong style="color: #000000;">Location:</strong> ${properties["Block Address"] || "N/A"}</p>
            <p style="margin: 4px 0; color: #333333; font-size: 12px;"><strong style="color: #000000;">Nature:</strong> ${properties["Nature Of Call"] || "N/A"}</p>
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
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, [lng, lat, zoom, updateTimeFilter]);

  // Update filter whenever timeRange changes
  useEffect(() => {
    updateTimeFilter();
  }, [updateTimeFilter]);

  return (
    <div className="relative">
      <div className="absolute top-0 left-0 bg-black bg-opacity-70 text-white p-2 z-10 m-2 rounded flex flex-col gap-2">
        <div>
          Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
        </div>
        <div className="flex gap-2">
          {Object.entries(TIME_RANGES).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={`px-3 py-1 rounded ${
                timeRange === value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default Map;
