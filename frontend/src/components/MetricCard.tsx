import React from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  subtitle: string;
  value: string | number;
  secondaryValue?: string;
  badgeText?: string;
  badgeVariant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  icon: LucideIcon;
  iconBgColor?: string;
  details: { label: string; value: string | number }[];
  actionLabel?: string;
  onActionClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  subtitle,
  value,
  secondaryValue,
  badgeText,
  badgeVariant = 'cyan',
  icon: Icon,
  iconBgColor = 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
  details,
  actionLabel = 'Explore Module',
  onActionClick,
}) => {
  const getBadgeClass = () => {
    switch (badgeVariant) {
      case 'emerald':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
      case 'amber':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/40';
      case 'rose':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/40';
      case 'cyan':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group">
      {/* Background ambient glow */}
      <div className="absolute -right-12 -top-12 w-36 h-36 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-500" />

      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconBgColor} border flex items-center justify-center shadow-md`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="heading-font font-bold text-base text-white tracking-wide">{title}</h3>
              <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
            </div>
          </div>

          {badgeText && (
            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${getBadgeClass()}`}>
              {badgeText}
            </span>
          )}
        </div>

        {/* Primary Value Display */}
        <div className="my-4">
          <div className="flex items-baseline space-x-2">
            <span className="heading-font text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {value}
            </span>
            {secondaryValue && (
              <span className="text-xs font-semibold text-slate-400">
                {secondaryValue}
              </span>
            )}
          </div>
        </div>

        {/* Detailed Breakdown List */}
        <div className="space-y-2 py-3 border-t border-slate-800/80">
          {details.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-normal">{item.label}</span>
              <span className="font-mono font-semibold text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-2 border-t border-slate-800/60 flex items-center justify-end">
        <button
          onClick={onActionClick}
          className="text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 flex items-center space-x-1 hover:underline transition"
        >
          <span>{actionLabel}</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  );
};
