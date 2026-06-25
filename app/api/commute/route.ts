import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { originLat, originLng, destLat, destLng } = await req.json();

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  const origin = `${originLat},${originLng}`;
  const destination = `${destLat},${destLng}`;

  // Fetch transit directions
  const transitUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=transit&language=en&key=${key}`;
  const walkUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=walking&language=en&key=${key}`;

  const [transitRes, walkRes] = await Promise.all([
    fetch(transitUrl),
    fetch(walkUrl),
  ]);

  const [transitData, walkData] = await Promise.all([
    transitRes.json(),
    walkRes.json(),
  ]);

  const results: {
    transit?: ReturnType<typeof parseRoute>;
    walking?: ReturnType<typeof parseRoute>;
  } = {};

  if (transitData.routes?.[0]) {
    results.transit = parseRoute(transitData.routes[0], "transit");
  }

  if (walkData.routes?.[0]) {
    results.walking = parseRoute(walkData.routes[0], "walking");
  }

  return NextResponse.json(results);
}

function parseRoute(route: {
  legs?: Array<{
    duration?: { text: string };
    distance?: { text: string };
    steps?: Array<{
      html_instructions?: string;
      duration?: { text: string };
      distance?: { text: string };
      transit_details?: {
        departure_stop?: { name: string };
        arrival_stop?: { name: string };
        line?: {
          short_name?: string;
          name?: string;
          vehicle?: { type?: string };
        };
      };
    }>;
  }>;
}, mode: string) {
  const leg = route.legs?.[0];
  if (!leg) return null;

  const steps = (leg.steps || []).map((step: {
    html_instructions?: string;
    duration?: { text: string };
    distance?: { text: string };
    transit_details?: {
      departure_stop?: { name: string };
      arrival_stop?: { name: string };
      line?: {
        short_name?: string;
        name?: string;
        vehicle?: { type?: string };
      };
    };
  }) => {
    // Strip HTML tags from instructions
    const instruction = (step.html_instructions || "")
      .replace(/<[^>]+>/g, "")
      .trim();

    const result: {
      instruction: string;
      duration: string;
      distance?: string;
      transitLine?: string;
      transitVehicle?: string;
      departureStop?: string;
      arrivalStop?: string;
    } = {
      instruction,
      duration: step.duration?.text || "",
      distance: step.distance?.text,
    };

    if (step.transit_details) {
      result.transitLine =
        step.transit_details.line?.short_name ||
        step.transit_details.line?.name;
      result.transitVehicle = step.transit_details.line?.vehicle?.type;
      result.departureStop = step.transit_details.departure_stop?.name;
      result.arrivalStop = step.transit_details.arrival_stop?.name;
    }

    return result;
  });

  return {
    duration: leg.duration?.text || "N/A",
    distance: leg.distance?.text || "N/A",
    mode,
    steps,
  };
}
