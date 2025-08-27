// lib/backendApi.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Get the latest observation (live data) for a given site.
 */
export async function getLatestObservation(siteId: string) {
  const res = await fetch(`${BASE_URL}/obs/latest?site=${siteId}`);
  if (!res.ok) throw new Error('Failed to fetch latest observation');
  return res.json();
}

/**
 * Get historical observation data for charting/trends.
 * Accepts time range and downsampling bucket (e.g., 1m, 5m).
 */
export async function getObservationRange(
  siteId: string,
  from: string,
  to: string,
  bucket = '1m'
) {
  const res = await fetch(
    `${BASE_URL}/obs/range?site=${siteId}&from=${from}&to=${to}&bucket=${bucket}`
  );
  if (!res.ok) throw new Error('Failed to fetch range data');
  return res.json();
}

/**
 * Get wind forecast data for the specified site.
 */
export async function getForecast(siteId: string) {
  const res = await fetch(`${BASE_URL}/forecast/wind?site=${siteId}`);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  return res.json();
}
