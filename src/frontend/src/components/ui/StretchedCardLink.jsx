import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { discoveryReturn } from '@/utils/discoveryReturn';
import '@/styles/interactive-card.css';

/** Parent must use interactive-card; sibling controls use relative z-20. */
export default function StretchedCardLink({ to, label, state }) {
  const location = useLocation();
  return <Link to={to} state={state ?? discoveryReturn(location)} aria-label={label}
    className="stretched-card-link absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" />;
}
