export function discoveryReturn(location) {
  const ownListing = ['/', '/services', '/student/wishlist'].includes(location.pathname);
  const context = ownListing ? { listingReturn: location.pathname + location.search, listingKey: location.key } : location.state;
  if (!context || typeof context.listingReturn !== 'string'
      || !/^(?:\/|\/services|\/student\/wishlist)(?:\?[^#]*)?$/.test(context.listingReturn)) return null;
  return { listingReturn: context.listingReturn, listingKey: context.listingKey };
}
