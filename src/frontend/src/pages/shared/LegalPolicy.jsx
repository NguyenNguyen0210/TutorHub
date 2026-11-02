import React from 'react';
import { Link } from 'react-router-dom';
import { legalPolicies } from '@/content/legalPolicies';

export default function LegalPolicy({ kind }) {
  const policy = legalPolicies[kind];
  return <div className="page-shell py-10 sm:py-14">
    <header className="max-w-3xl"><h1 className="text-headline-page text-fg">{policy.title}</h1><p className="mt-4 text-body-lg leading-relaxed text-fg-secondary">{policy.description}</p></header>
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
      <nav aria-label="Mục lục chính sách" className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-24"><p className="mb-3 font-semibold text-fg">Nội dung</p><ul className="space-y-1">{policy.sections.map(section => <li key={section.id}><a href={`#${section.id}`} className="inline-flex min-h-11 items-center rounded-lg py-2 text-sm leading-relaxed text-fg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{section.title}</a></li>)}</ul></nav>
      <article className="max-w-3xl space-y-8">{policy.sections.map(section => <section id={section.id} key={section.id} className="scroll-mt-28 space-y-3"><h2 className="text-xl font-semibold text-fg">{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph} className="text-body-reg leading-7 text-fg-secondary">{paragraph}</p>)}</section>)}<div className="flex flex-wrap gap-5 border-t border-border pt-6"><Link to={kind === 'terms' ? '/privacy' : '/terms'} className="inline-flex min-h-11 items-center rounded font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{kind === 'terms' ? 'Chính sách bảo mật' : 'Điều khoản sử dụng'}</Link><a href="mailto:support@tutorhub.vn" className="inline-flex min-h-11 items-center rounded font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Liên hệ hỗ trợ</a></div></article>
    </div>
  </div>;
}
