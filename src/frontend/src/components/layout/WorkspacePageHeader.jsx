import React from 'react';

/** Consistent page heading, supporting text and wrapping actions for workspace pages. */
export default function WorkspacePageHeader({ title, description, actions }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-headline-page tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-body-reg leading-relaxed text-fg-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
