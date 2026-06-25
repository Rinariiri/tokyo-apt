import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    // Fetch the property page
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en;q=0.9",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const html = await res.text();

    // Parse with cheerio via dynamic import
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    let address = "";
    let propertyName = "";
    let rent = "";

    // arealty.jp specific selectors
    // Try common address patterns
    const addressSelectors = [
      '[class*="address"]',
      '[class*="location"]',
      '[class*="addr"]',
      'th:contains("所在地"), th:contains("住所"), th:contains("Address")',
      'dt:contains("所在地"), dt:contains("住所")',
      'td:contains("東京都"), td:contains("Tokyo")',
      'p:contains("東京都")',
      'span:contains("東京都")',
    ];

    // Try to find address in table rows (common on Japanese real estate sites)
    $("tr").each((_, row) => {
      const th = $(row).find("th").text().trim();
      const td = $(row).find("td").text().trim();
      if (
        (th.includes("所在地") || th.includes("住所") || th.includes("Address") || th.includes("location")) &&
        td
      ) {
        address = td;
      }
    });

    // Try definition lists
    if (!address) {
      $("dl").each((_, dl) => {
        $(dl)
          .find("dt")
          .each((i, dt) => {
            const label = $(dt).text().trim();
            if (label.includes("所在地") || label.includes("住所") || label.includes("Address")) {
              const dd = $(dl).find("dd").eq(i);
              address = dd.text().trim();
            }
          });
      });
    }

    // Try meta tags
    if (!address) {
      const metaDesc = $('meta[name="description"]').attr("content") || "";
      const ogTitle = $('meta[property="og:title"]').attr("content") || "";
      // Extract Tokyo address pattern from meta
      const tokyoMatch = (metaDesc + " " + ogTitle).match(
        /東京都[\u4e00-\u9fa5\u3040-\u30ff\w\s-]+[区市町村]/
      );
      if (tokyoMatch) address = tokyoMatch[0];
    }

    // Try looking for any element with Tokyo address pattern
    if (!address) {
      $("*").each((_, el) => {
        const text = $(el).children().length === 0 ? $(el).text().trim() : "";
        if (
          text.match(/^東京都/) &&
          text.length < 100 &&
          text.length > 5
        ) {
          address = text;
          return false; // break
        }
      });
    }

    // Get property name from title or h1
    propertyName =
      $("h1").first().text().trim() ||
      $("title").text().replace(/[\|｜\-–].*/g, "").trim();

    // Try to get rent
    $("tr").each((_, row) => {
      const th = $(row).find("th").text().trim();
      const td = $(row).find("td").text().trim();
      if (th.includes("賃料") || th.includes("家賃") || th.includes("Rent")) {
        rent = td;
      }
    });

    // Geocode the address using Google Maps Geocoding API
    let lat: number | undefined;
    let lng: number | undefined;

    if (address && process.env.GOOGLE_MAPS_API_KEY) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=ja&region=JP`;

      const geocodeRes = await fetch(geocodeUrl);
      const geocodeData = await geocodeRes.json();

      if (geocodeData.results?.[0]) {
        lat = geocodeData.results[0].geometry.location.lat;
        lng = geocodeData.results[0].geometry.location.lng;
      }
    }

    // Fallback: try to geocode just the URL-based location hint
    if (!address) {
      // Extract location from URL (e.g. /tokyo/edogawa-ku/)
      const urlMatch = url.match(/\/([a-z]+-ku|[a-z]+-shi|[a-z]+-machi)\//);
      if (urlMatch) {
        address = `Tokyo, ${urlMatch[1].replace(/-/g, " ")}`;
      } else {
        address = "Address not found - please check the listing manually";
      }
    }

    return NextResponse.json({
      address,
      name: propertyName,
      rent,
      lat,
      lng,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to scrape: ${message}` },
      { status: 500 }
    );
  }
}
