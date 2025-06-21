// API Route to fetch crime data from SQLite database (App Router)

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

// Database connection
async function openDb() {
  return open({
    filename: path.join(process.cwd(), "crime_data.db"),
    driver: sqlite3.Database,
  });
}

// Helper function to get date range
function getDateRange(range) {
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

  return [startDate.toISOString(), endDate.toISOString()];
}

// GET handler for App Router
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "3M";
    const crimeTypes = searchParams.get("crimeTypes");

    const db = await openDb();
    const [startDate, endDate] = getDateRange(timeRange);

    // Build the query based on crime type filters
    let query = `
      SELECT
        case_number,
        reported_date,
        nature_of_call,
        from_date,
        description,
        block_address,
        city,
        state,
        division,
        attempt_complete,
        location_description,
        latitude,
        longitude
      FROM crime_data
      WHERE reported_date >= ?
        AND reported_date <= ?
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `;

    let queryParams = [startDate, endDate];

    // Add crime type filtering if specified
    if (crimeTypes && crimeTypes !== "ALL") {
      const selectedTypes = crimeTypes.split(",");
      const crimeConditions = [];

      selectedTypes.forEach((type) => {
        switch (type) {
          case "MURDER":
            crimeConditions.push("nature_of_call LIKE '%MURDER%'");
            break;
          case "THEFT":
            crimeConditions.push("nature_of_call LIKE '%THEFT%'");
            break;
          case "BURGLARY":
            crimeConditions.push("nature_of_call LIKE '%BURGLARY%'");
            break;
          case "ASSAULT":
            crimeConditions.push("nature_of_call LIKE '%ASSAULT%'");
            break;
          case "DWI":
            crimeConditions.push("nature_of_call LIKE '%DWI%'");
            break;
        }
      });

      if (crimeConditions.length > 0) {
        query += ` AND (${crimeConditions.join(" OR ")})`;
      }
    }

    query += ` ORDER BY reported_date DESC`;

    // Query crime data within date range and with valid coordinates
    const crimes = await db.all(query, queryParams);

    await db.close();

    // Convert to GeoJSON format for Mapbox
    const geojson = {
      type: "FeatureCollection",
      features: crimes.map((crime) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            parseFloat(crime.longitude),
            parseFloat(crime.latitude),
          ],
        },
        properties: {
          "Case Number": crime.case_number,
          "Reported Date": crime.reported_date,
          "Nature Of Call": crime.nature_of_call,
          "From Date": crime.from_date,
          Description: crime.description,
          "Block Address": crime.block_address,
          City: crime.city,
          State: crime.state,
          Division: crime.division,
          "Attempt Complete": crime.attempt_complete,
          "Location Description": crime.location_description,
          Isodate: crime.reported_date, // For compatibility with existing filter logic
        },
      })),
    };

    return NextResponse.json(geojson);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 },
    );
  }
}
