import React from 'react';

export const SpecTagBadge: React.FC<{ tag: string; className?: string }> = ({
  tag,
  className = '',
}) => {
  if (!tag || tag === '―') return null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-300 whitespace-nowrap shrink-0 ${className}`}
      title={`仕様書対応項目: ${tag}`}
    >
      {tag}
    </span>
  );
};
