import { Link, FileText, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabType = 'url' | 'file' | 'record';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'url' as TabType, label: 'From URL', icon: Link },
  { id: 'file' as TabType, label: 'From file', icon: FileText },
  { id: 'record' as TabType, label: 'Record', icon: Mic },
];

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative',
              'hover:text-foreground',
              activeTab === tab.id
                ? 'text-tab-active border-b-2 border-tab-active'
                : 'text-muted-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};