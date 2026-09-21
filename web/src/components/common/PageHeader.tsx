import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'cyan' | 'red' | 'green' | 'yellow' | 'blue';
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; onClick?: () => void }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeVariant = 'cyan',
  actions,
  breadcrumbs,
}) => {
  const badgeClasses = {
    cyan: 'bg-[#EDFAFC] text-[#075B8A] border-[#AEEBF0]',
    red: 'bg-[#FEF1F3] text-[#E94B68] border-[#FDC8D1]',
    green: 'bg-[#EFFCF6] text-[#1E8A63] border-[#B7F1DC]',
    yellow: 'bg-[#FFFBF0] text-[#B78809] border-[#FDE8A4]',
    blue: 'bg-[#EBF4FA] text-[#075B8A] border-[#D1E6F0]',
  };

  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-[#708696] mb-1.5 font-medium">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                {b.onClick ? (
                  <button
                    onClick={b.onClick}
                    className="hover:text-[#075B8A] transition-colors"
                  >
                    {b.label}
                  </button>
                ) : (
                  <span className="text-[#18364A] font-semibold">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-black text-[#18364A] tracking-tight font-sans">
            {title}
          </h1>
          {badge && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${badgeClasses[badgeVariant]}`}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#708696] mt-0.5 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};
