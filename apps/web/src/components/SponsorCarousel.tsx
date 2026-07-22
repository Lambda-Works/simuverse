'use client'
import { useState } from 'react';

export interface SponsorItem {
  id: number;
  name: string;
  logo_url?: string;
  website?: string;
}

interface SponsorCarouselProps {
  sponsors: SponsorItem[];
  title?: string;
}

const BRAND_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-600',
  'bg-orange-500',
  'bg-rose-500',
  'bg-teal-600',
  'bg-indigo-500',
  'bg-amber-600',
];

const getColor = (name: string) =>
  BRAND_COLORS[((name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0)) % BRAND_COLORS.length];

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

function SponsorLogo({ sponsor }: { sponsor: SponsorItem }) {
  const [imgError, setImgError] = useState(false);

  const content = (
    <div className="flex items-center gap-2.5 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
      {sponsor.logo_url && !imgError ? (
        <img
          src={sponsor.logo_url}
          alt={sponsor.name}
          className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-100"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${getColor(
            sponsor.name,
          )}`}
        >
          {getInitials(sponsor.name)}
        </div>
      )}
      <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate max-w-[140px]">
        {sponsor.name}
      </span>
    </div>
  );

  if (sponsor.website) {
    return (
      <a
        href={sponsor.website}
        target="_blank"
        rel="noopener noreferrer"
        title={sponsor.name}
        className="focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-full"
      >
        {content}
      </a>
    );
  }

  return content;
}

export function SponsorCarousel({ sponsors, title = 'Sponsors y Aliados' }: SponsorCarouselProps) {
  if (!sponsors || sponsors.length === 0) return null;

  return (
    <div className="w-full py-4 space-y-3">
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
          {title}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 max-w-5xl mx-auto px-4">
        {sponsors.map((sponsor) => (
          <SponsorLogo key={sponsor.id} sponsor={sponsor} />
        ))}
      </div>
    </div>
  );
}
