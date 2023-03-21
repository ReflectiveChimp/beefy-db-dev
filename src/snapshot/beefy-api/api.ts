import fetch from 'node-fetch';
import type { ApyResponse, PriceResponse, TvlResponse } from './types.js';

async function get<T>(path: string, cacheBuster: string): Promise<T> {
  const response = await fetch(`https://api.beefy.finance/${path}?_=${cacheBuster}`);
  return response.json() as T;
}

export async function getApys(cacheBuster: string): Promise<ApyResponse> {
  return await get<ApyResponse>('apy', cacheBuster);
}

export async function getPrices(cacheBuster: string): Promise<PriceResponse> {
  return await get<PriceResponse>('prices', cacheBuster);
}

export async function getLpPrices(cacheBuster: string): Promise<PriceResponse> {
  return await get<PriceResponse>('lps', cacheBuster);
}

export async function getTvls(cacheBuster: string): Promise<TvlResponse> {
  return await get<TvlResponse>('tvl', cacheBuster);
}
