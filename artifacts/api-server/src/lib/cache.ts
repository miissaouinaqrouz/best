const priceCache = new Map<string, { currentPrice: number; bidCount: number; endTime: Date; updatedAt: number }>();

export function setCachedAuction(auctionId: string, data: { currentPrice: number; bidCount: number; endTime: Date }) {
  priceCache.set(auctionId, { ...data, updatedAt: Date.now() });
}

export function getCachedAuction(auctionId: string) {
  const entry = priceCache.get(auctionId);
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > 5000) {
    priceCache.delete(auctionId);
    return null;
  }
  return entry;
}

export function invalidateCache(auctionId: string) {
  priceCache.delete(auctionId);
}

export function clearCache() {
  priceCache.clear();
}
