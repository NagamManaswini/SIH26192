import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { NavigationTab } from '../types';

interface ModulePlaceholderPageProps {
  tabId: NavigationTab;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  targetMilestone: string;
  upcomingFeatures: string[];
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderPageProps> = ({
  title,
  subtitle,
  description,
  icon: Icon,
  targetMilestone,
  upcomingFeatures
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800 text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/10">
          <Icon className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Scheduled for {targetMilestone}</span>
        </div>

        <h2 className="heading-font text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl mx-auto mb-4">
          {subtitle}
        </p>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          {description}
        </p>

        <div className="max-w-lg mx-auto bg-slate-900/80 rounded-2xl p-6 border border-slate-800 text-left">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            Module Specifications
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            {upcomingFeatures.map((feat, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
