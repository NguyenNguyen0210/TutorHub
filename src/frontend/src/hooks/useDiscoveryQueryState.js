import { useEffect, useRef } from 'react';

export function readDiscoveryQuery(params, kind) {
  const ceiling = kind === 'services' ? 10000000 : 5000000;
  const number = (key, fallback, min, max) => {
    const raw = params.get(key);
    const value = raw === null || raw === '' ? fallback : Number(raw);
    return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  };
  const minPrice = number('minPrice', 0, 0, ceiling);
  const sorts = kind === 'services' ? ['priority', 'rating_desc', 'price_asc', 'price_desc', 'newest', 'sessions_desc'] : ['priority', 'rating_desc', 'price_asc', 'price_desc', 'exp_desc'];
  return {
    q: params.get('q') || '', categoryId: params.get('categoryId') || '',
    subjectId: params.get('subjectId') || '', minPrice,
    maxPrice: Math.max(minPrice, number('maxPrice', ceiling, 0, ceiling)),
    minRating: params.has('minRating') ? number('minRating', 0, 0, 5) || null : null,
    sort: sorts.includes(params.get('sort')) ? params.get('sort') : 'priority',
    page: Math.floor(number('page', 1, 1, 10000)),
    degree: params.get('degree') || 'All', university: params.get('university') || 'All',
    certification: params.get('certification') || 'All',
    experience: ['<1', '1-2', '3-5', '>=6'].includes(params.get('experience')) ? params.get('experience') : 'All',
  };
}

/** URL is shareable; external query navigation restores controls and debounced API values. */
export default function useDiscoveryQueryState({ searchParams, setSearchParams, kind, values, setters }) {
  const search = searchParams.toString();
  const serialized = JSON.stringify(values);
  const committed = useRef(null);
  const restoring = useRef(false);
  const latest = useRef({ values, setters });
  latest.current = { values, setters };

  useEffect(() => {
    if (search === committed.current) return;
    committed.current = search;
    restoring.current = true;
    const parsed = readDiscoveryQuery(new URLSearchParams(search), kind);
    Object.entries(latest.current.setters).forEach(([key, set]) => set(parsed[key]));
  }, [search, kind]);

  useEffect(() => {
    if (restoring.current) { restoring.current = false; return; }
    const params = new URLSearchParams(search);
    const defaults = readDiscoveryQuery(new URLSearchParams(), kind);
    Object.entries(latest.current.values).forEach(([key, value]) => {
      if (value == null || value === '' || value === defaults[key]) params.delete(key);
      else params.set(key, String(value));
    });
    const next = params.toString();
    if (next !== search) {
      committed.current = next;
      setSearchParams(params, { replace: true });
    }
  }, [serialized, search, kind, setSearchParams]);
}
