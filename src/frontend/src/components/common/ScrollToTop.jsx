import { useLayoutEffect, useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { getTitleForPathname } from '@/config/pageTitles';

const positions = new Map();
const scrollTo = (top) => {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo({ top, left: 0, behavior: 'instant' });
  root.style.scrollBehavior = previous;
};

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPath = useRef(null);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const { pathname, hash, key, state } = location;
    const title = getTitleForPathname(pathname);
    if (title) document.title = title;
    const samePage = previousPath.current === pathname;
    previousPath.current = pathname;
    const restoreKey = state?.restoreScrollKey || (navigationType === 'POP' ? key : null);
    const target = restoreKey ? positions.get(restoreKey) : undefined;
    let restoring = target !== undefined || Boolean(hash);
    let timer;
    let observer;
    let resizeObserver;
    const save = () => {
      if (restoring) return;
      positions.set(key, window.scrollY);
      if (positions.size > 100) positions.delete(positions.keys().next().value);
    };
    const stop = () => {
      restoring = false;
      observer?.disconnect();
      resizeObserver?.disconnect();
      clearTimeout(timer);
    };
    const restore = () => {
      if (!restoring) return;
      if (hash) {
        let id;
        try { id = decodeURIComponent(hash.slice(1)); } catch { id = hash.slice(1); }
        const element = document.getElementById(id);
        if (element) { element.scrollIntoView({ behavior: 'instant' }); stop(); }
        return;
      }
      if (document.querySelector('[data-discovery-loading="true"]')) return;
      scrollTo(target);
      if (Math.abs(window.scrollY - target) < 2) stop();
    };
    if (restoring) {
      observer = new MutationObserver(restore);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-discovery-loading'] });
      resizeObserver = new ResizeObserver(restore);
      resizeObserver.observe(document.body);
      timer = setTimeout(stop, 8000);
      restore();
    } else if (!samePage) scrollTo(0);

    window.addEventListener('scroll', save, { passive: true });
    window.addEventListener('pagehide', save);
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stop);
    save();
    return () => {
      stop();
      window.removeEventListener('scroll', save);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', stop);
    };
  }, [location, navigationType]);

  return null;
}
