import React from 'react';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export default function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id || '');

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Bar */}
      <div className="flex border-b border-v3-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-6 py-3 text-sm font-semibold transition-colors relative
              ${activeTab === tab.id
                ? 'text-v3-accent'
                : 'text-v3-secondary hover:text-v3-primary'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-v3-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-6">{activeTabData?.content}</div>
    </div>
  );
}
