"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
mapboxgl.accessToken = mapboxToken;

// Time range options
const TIME_RANGES = {
  "1M": "1 Month",
  "3M": "3 Months",
  "6M": "6 Months",
  "1Y": "1 Year",
};

// Crime type options
const CRIME_TYPES = [
  { value: "MURDER", label: "Murder" },
  { value: "AUTO THEFT", label: "Auto Theft" },
  { value: "THEFT", label: "Theft" },
  { value: "BURGLARY", label: "Burglary" },
  { value: "ASSAULT", label: "Assault" },
  { value: "DWI", label: "DWI" },
];

function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-97.32);
  const [lat, setLat] = useState(32.72541);
  const [zoom, setZoom] = useState(9);
  const [timeRange, setTimeRange] = useState("1M");
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
  const [isCrimeFilterOpen, setIsCrimeFilterOpen] = useState(false);
  const [isGeocoderOpen, setIsGeocoderOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Function to fetch crime data from API
  const fetchCrimeData = useCallback(async (range, types = []) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        timeRange: range,
        crimeTypes: types.length === 0 ? "ALL" : types.join(","),
      });
      const response = await fetch(`/api/crimes?${params}`);
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
    async (range, types) => {
      if (!map.current) return;

      const crimeData = await fetchCrimeData(range, types);
      if (!crimeData) return;

      // Update the data source
      if (map.current.getSource("crimes")) {
        map.current.getSource("crimes").setData(crimeData);
      }
    },
    [fetchCrimeData],
  );

  // Handle mobile geocoder search
  const handleMobileSearch = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&bbox=-99.0,25.8,-93.5,36.5&proximity=${lng},${lat}&limit=5`,
        );
        const data = await response.json();
        setSearchResults(data.features || []);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      }
    },
    [lng, lat],
  );

  // Handle search result selection
  const handleSearchResultSelect = useCallback((result) => {
    const [longitude, latitude] = result.center;
    map.current?.flyTo({
      center: [longitude, latitude],
      zoom: 14,
      duration: 2000,
    });

    // Add to recent searches
    const searchText = result.place_name;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== searchText);
      return [searchText, ...filtered].slice(0, 5);
    });

    setIsGeocoderOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && isGeocoderOpen) {
        handleMobileSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isGeocoderOpen, handleMobileSearch]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      const wasNotMobile = isMobile === false;
      setIsMobile(mobile);

      // Set default states for mobile only on initial load or when switching to mobile
      if (mobile && (wasNotMobile || isMobile === false)) {
        setIsTimeFilterOpen(true); // Time filter expanded by default on mobile
        setIsCrimeFilterOpen(false); // Crime filter collapsed by default on mobile
        setIsGeocoderOpen(false); // Geocoder collapsed by default on mobile
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [isMobile]);

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
      const initialData = await fetchCrimeData(timeRange, selectedCrimeTypes);

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
              "MURDER",
              "#DC143C",
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

        // Move the crime points layer below label layers to prevent hiding city names
        // Find the first symbol layer (labels) and move crime points before it
        const layers = map.current.getStyle().layers;
        const labelLayerId = layers.find(
          (layer) =>
            layer.type === "symbol" &&
            layer.layout &&
            layer.layout["text-field"],
        )?.id;

        if (labelLayerId) {
          map.current.moveLayer("crime-points", labelLayerId);
        }

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

    // Add geocoder for desktop (will be hidden on mobile via CSS)
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxToken,
      mapboxgl: mapboxgl,
      placeholder: "Search for places...",
      bbox: [-99.0, 25.8, -93.5, 36.5], // Texas bounds
      proximity: {
        longitude: lng,
        latitude: lat,
      },
      marker: true, // We'll handle markers ourselves
    });
    map.current.addControl(geocoder, "top-left");

    // Add navigation controls based on device type
    const navControl = new mapboxgl.NavigationControl({
      showCompass: false,
      showZoom: true,
      visualizePitch: false,
    });

    // Always add controls, but they'll be hidden via CSS on mobile
    map.current.addControl(navControl, "top-right");

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, [lng, lat, zoom, timeRange, selectedCrimeTypes, fetchCrimeData]);

  // Update data when time range or crime types change
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      updateMapData(timeRange, selectedCrimeTypes);
    }
  }, [timeRange, selectedCrimeTypes, updateMapData]);

  // Handle crime type selection
  const handleCrimeTypeChange = (crimeType) => {
    setSelectedCrimeTypes((prev) => {
      if (prev.includes(crimeType)) {
        return prev.filter((type) => type !== crimeType);
      } else {
        return [...prev, crimeType];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCrimeTypes.length === CRIME_TYPES.length) {
      setSelectedCrimeTypes([]);
    } else {
      setSelectedCrimeTypes(CRIME_TYPES.map((type) => type.value));
    }
  };

  return (
    <div className="relative">
      {/* Desktop Layout */}
      {!isMobile && (
        <>
          <div className="absolute top-0 left-0 bg-black bg-opacity-70 text-white p-2 z-10 m-2 rounded flex flex-col gap-2">
            <div>
              Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
            </div>
            {error && (
              <div className="text-sm text-red-400 bg-red-900 bg-opacity-50 p-2 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Time Range Filter - Top Right (Left of Nature of Call Filter) */}
          <div className="absolute top-0 right-64 bg-black bg-opacity-70 text-white p-2 z-10 m-2 rounded mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Time Range:</label>
              <div className="flex gap-2 items-center flex-wrap">
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
                {loading && (
                  <div className="text-sm text-gray-300">Loading...</div>
                )}
              </div>
            </div>
          </div>

          {/* Nature of Call Filter - Top Right (Left of Zoom Controls) */}
          <div className="absolute top-0 right-16 bg-black bg-opacity-70 text-white p-3 z-10 m-2 rounded max-w-xs mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Nature of Call:</label>

              {/* Select All / Deselect All Button */}
              <button
                onClick={handleSelectAll}
                disabled={loading}
                className={`px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 transition-colors ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {selectedCrimeTypes.length === CRIME_TYPES.length
                  ? "Deselect All"
                  : "Select All"}
              </button>

              {/* Crime Type Checkboxes */}
              <div className="flex flex-col gap-1">
                {CRIME_TYPES.map((crimeType) => (
                  <label
                    key={crimeType.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCrimeTypes.includes(crimeType.value)}
                      onChange={() => handleCrimeTypeChange(crimeType.value)}
                      disabled={loading}
                      className={`w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                    <span className={loading ? "opacity-50" : ""}>
                      {crimeType.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Show count of selected types */}
              <div className="text-xs text-gray-300 mt-1">
                {selectedCrimeTypes.length === 0
                  ? "Showing all crime types"
                  : `Showing ${selectedCrimeTypes.length} of ${CRIME_TYPES.length} types`}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <>
          {/* Error display for mobile */}
          {error && (
            <div className="absolute top-2 left-2 right-2 text-sm text-red-400 bg-red-900 bg-opacity-50 p-2 rounded z-10">
              {error}
            </div>
          )}

          {/* Collapsible Geocoder - Mobile (Centered) */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
            {!isGeocoderOpen ? (
              /* Collapsed State - Search Icon */
              <button
                onClick={() => setIsGeocoderOpen(true)}
                className="bg-black bg-opacity-80 text-white p-3 rounded-full shadow-lg border border-gray-700 hover:bg-opacity-90 transition-all touch-manipulation"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            ) : (
              /* Expanded State - Search Bar */
              <div className="bg-black bg-opacity-90 text-white rounded-lg shadow-lg border border-gray-700 min-w-80 max-w-sm">
                <div className="flex items-center p-3">
                  <input
                    type="text"
                    placeholder="Search for places..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-gray-300 outline-none text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setIsGeocoderOpen(false);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="ml-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border-t border-gray-600 max-h-48 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleSearchResultSelect(result)}
                        className="text-sm p-3 hover:bg-gray-700 border-b border-gray-700 last:border-b-0 cursor-pointer transition-colors"
                      >
                        <div className="font-medium text-white">
                          {result.text}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {result.place_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Searches */}
                {searchResults.length === 0 &&
                  recentSearches.length > 0 &&
                  !searchQuery && (
                    <div className="border-t border-gray-600 p-2">
                      <div className="text-xs text-gray-400 mb-2">
                        Recent searches:
                      </div>
                      {recentSearches.slice(0, 3).map((search, index) => (
                        <div
                          key={index}
                          onClick={() => setSearchQuery(search)}
                          className="text-sm p-2 hover:bg-gray-700 rounded cursor-pointer transition-colors"
                        >
                          {search}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Time Range Filter - Mobile (Left side, expanded by default) */}
          <div className="absolute top-20 left-2 bg-black bg-opacity-80 text-white rounded-lg z-10 min-w-48 shadow-lg border border-gray-700">
            <button
              onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
              className="w-full px-3 py-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between touch-manipulation"
            >
              <span>Time Range</span>
              <span className="text-xs font-bold">
                {isTimeFilterOpen ? "▲" : "▼"}
              </span>
            </button>

            {isTimeFilterOpen && (
              <div className="p-3 border-t border-gray-600 bg-gray-800 rounded-b-lg">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TIME_RANGES).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setTimeRange(value)}
                      disabled={loading}
                      className={`px-2 py-2 text-xs rounded-md transition-colors touch-manipulation ${
                        timeRange === value
                          ? "bg-blue-500 text-white font-semibold"
                          : "bg-gray-700 hover:bg-gray-600"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {loading && (
                  <div className="text-xs text-gray-300 mt-3 pt-2 border-t border-gray-600 text-center">
                    Loading...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nature of Call Filter - Mobile (Left side, below Time Range with spacing) */}
          <div
            className="absolute left-2 bg-black bg-opacity-80 text-white rounded-lg z-10 min-w-48 shadow-lg border border-gray-700 transition-all duration-300 ease-in-out"
            style={{ top: isTimeFilterOpen ? "280px" : "160px" }}
          >
            <button
              onClick={() => setIsCrimeFilterOpen(!isCrimeFilterOpen)}
              className="w-full px-3 py-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between touch-manipulation"
            >
              <span>Nature of Call</span>
              <span className="text-xs font-bold">
                {isCrimeFilterOpen ? "▲" : "▼"}
              </span>
            </button>

            {isCrimeFilterOpen && (
              <div className="p-3 border-t border-gray-600 bg-gray-800 rounded-b-lg">
                {/* Select All / Deselect All Button */}
                <button
                  onClick={handleSelectAll}
                  disabled={loading}
                  className={`w-full px-2 py-2 text-xs rounded-md bg-blue-600 hover:bg-blue-700 transition-colors mb-3 touch-manipulation ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {selectedCrimeTypes.length === CRIME_TYPES.length
                    ? "Deselect All"
                    : "Select All"}
                </button>

                {/* Crime Type Checkboxes */}
                <div className="flex flex-col gap-2">
                  {CRIME_TYPES.map((crimeType) => (
                    <label
                      key={crimeType.value}
                      className="flex items-center gap-3 text-xs cursor-pointer py-1 touch-manipulation"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCrimeTypes.includes(crimeType.value)}
                        onChange={() => handleCrimeTypeChange(crimeType.value)}
                        disabled={loading}
                        className={`w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 touch-manipulation ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      />
                      <span
                        className={`${loading ? "opacity-50" : ""} leading-tight`}
                      >
                        {crimeType.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Show count of selected types */}
                <div className="text-xs text-gray-300 mt-3 pt-2 border-t border-gray-600">
                  {selectedCrimeTypes.length === 0
                    ? "Showing all types"
                    : `${selectedCrimeTypes.length} of ${CRIME_TYPES.length} selected`}
                </div>
              </div>
            )}
          </div>

          {/* Custom Zoom Controls - Mobile (Bottom-right, minimal) */}
          <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-10">
            <button
              onClick={() => map.current?.zoomIn()}
              className="bg-black bg-opacity-60 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold hover:bg-opacity-80 transition-all touch-manipulation shadow-lg"
            >
              +
            </button>
            <button
              onClick={() => map.current?.zoomOut()}
              className="bg-black bg-opacity-60 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold hover:bg-opacity-80 transition-all touch-manipulation shadow-lg"
            >
              −
            </button>
          </div>
        </>
      )}

      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default Map;
