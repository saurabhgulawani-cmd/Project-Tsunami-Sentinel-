import { EarthquakeEvent } from '../types';

const USGS_API_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson';

// A subset of the USGS GeoJSON feature structure
interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string;
    time: number;
    updated: number;
    url: string;
    title: string;
    tsunami: 0 | 1;
  };
  geometry: {
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
}

/**
 * Maps a single USGS earthquake feature to our application's EarthquakeEvent type.
 * @param feature The feature object from the USGS GeoJSON feed.
 * @returns An EarthquakeEvent object or null if the feature is invalid (e.g., no magnitude).
 */
const mapUsgsFeatureToEarthquakeEvent = (feature: UsgsFeature): EarthquakeEvent | null => {
  if (feature.properties.mag === null || typeof feature.properties.mag === 'undefined') {
    return null;
  }

  const [lon, lat, depth] = feature.geometry.coordinates;
  const isTsunamiWarning = feature.properties.tsunami === 1;

  let alertLevel: EarthquakeEvent['alertLevel'] = 'none';
  if (isTsunamiWarning) {
    // An official tsunami flag from USGS is a strong indicator.
    // For this app, we'll map it to a 'warning'.
    alertLevel = 'warning';
  } else if (feature.properties.mag >= 7.5) {
    // Large earthquakes, even without an explicit tsunami flag, are significant.
    alertLevel = 'advisory';
  } else if (feature.properties.mag >= 6.5) {
    alertLevel = 'info';
  }

  return {
    id: feature.id,
    title: feature.properties.title,
    updated: new Date(feature.properties.updated),
    link: feature.properties.url,
    location: feature.properties.place,
    magnitude: feature.properties.mag,
    depth: depth,
    lat: lat,
    lon: lon,
    isTsunamiWarning: isTsunamiWarning,
    rawSummary: feature.properties.title, // Using title for raw summary
    alertLevel: alertLevel,
  };
};

/**
 * Fetches and processes earthquake data from the USGS GeoJSON feed.
 * @returns A promise that resolves to an array of EarthquakeEvent objects, sorted by most recent.
 */
export const fetchTsunamiData = async (): Promise<EarthquakeEvent[]> => {
  try {
    const response = await fetch(USGS_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from USGS: ${response.statusText}`);
    }
    const data = await response.json();

    if (data && Array.isArray(data.features)) {
      const events: EarthquakeEvent[] = data.features
        .map(mapUsgsFeatureToEarthquakeEvent)
        .filter((event: EarthquakeEvent | null): event is EarthquakeEvent => event !== null)
        .sort((a, b) => b.updated.getTime() - a.updated.getTime());
      return events;
    }
    
    console.warn('Received empty or invalid data from USGS feed.');
    return [];
  } catch (error) {
    console.error('Error in fetchTsunamiData:', error);
    // Re-throw the error so the calling component can handle it (e.g., show an error message)
    throw error;
  }
};
