import React from 'react';
import { cn } from '@/lib/utils';

// Base themed tooltip component for charts
interface ThemedChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ThemedChartTooltip: React.FC<ThemedChartTooltipProps> = ({
  active,
  payload,
  label,
  className,
  children
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "rounded-lg border bg-popover p-3 text-sm shadow-md transition-all",
      "border-border text-popover-foreground",
      className
    )}>
      {children}
    </div>
  );
};

// Simple tooltip for single value charts
interface SimpleTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  className?: string;
  formatter?: (value: any, name?: string) => string;
  labelFormatter?: (label: string) => string;
}

export const SimpleThemedTooltip: React.FC<SimpleTooltipProps> = ({
  active,
  payload,
  label,
  className,
  formatter,
  labelFormatter
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const value = payload[0].value;
  const name = payload[0].name || payload[0].dataKey;

  return (
    <ThemedChartTooltip active={active} payload={payload} label={label} className={className}>
      <div className="flex flex-col space-y-1">
        {label && (
          <span className="text-muted-foreground">
            {labelFormatter ? labelFormatter(label) : label}
          </span>
        )}
        <span className="font-medium text-popover-foreground">
          {formatter ? formatter(value, name) : value}
        </span>
      </div>
    </ThemedChartTooltip>
  );
};

// Multi-value tooltip for complex charts
interface MultiValueTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  className?: string;
  formatters?: Record<string, (value: any) => string>;
  labelFormatter?: (label: string) => string;
  colors?: Record<string, string>;
}

export const MultiValueThemedTooltip: React.FC<MultiValueTooltipProps> = ({
  active,
  payload,
  label,
  className,
  formatters = {},
  labelFormatter,
  colors = {}
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <ThemedChartTooltip active={active} payload={payload} label={label} className={className}>
      <div className="space-y-2">
        {label && (
          <div className="font-medium text-popover-foreground border-b border-border pb-1">
            {labelFormatter ? labelFormatter(label) : label}
          </div>
        )}
        <div className="space-y-1">
          {payload.map((entry, index) => {
            const key = entry.dataKey || entry.name;
            const formatter = formatters[key];
            const color = colors[key] || entry.color;
            
            return (
              <div key={index} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {color && (
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: color }}
                    />
                  )}
                  <span className="text-muted-foreground text-xs">
                    {entry.name || key}:
                  </span>
                </div>
                <span className="font-medium text-popover-foreground text-xs">
                  {formatter ? formatter(entry.value) : entry.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </ThemedChartTooltip>
  );
};

// Custom tooltip for specific data structures
interface CustomThemedTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  className?: string;
  render: (data: any, label?: string) => React.ReactNode;
}

export const CustomThemedTooltip: React.FC<CustomThemedTooltipProps> = ({
  active,
  payload,
  label,
  className,
  render
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <ThemedChartTooltip active={active} payload={payload} label={label} className={className}>
      {render(data, label)}
    </ThemedChartTooltip>
  );
};

// Utility function to get theme-aware colors for chart elements
export const getThemeAwareChartColors = () => {
  return {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    muted: 'hsl(var(--muted))',
    accent: 'hsl(var(--accent))',
    destructive: 'hsl(var(--destructive))',
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    info: 'hsl(var(--info))',
    border: 'hsl(var(--border))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    popover: 'hsl(var(--popover))',
    popoverForeground: 'hsl(var(--popover-foreground))',
  };
};

// Utility function to get cursor styles for chart interactions
export const getThemeAwareCursorStyle = () => {
  return {
    fill: 'hsl(var(--muted))',
    fillOpacity: 0.1,
    stroke: 'hsl(var(--border))',
    strokeWidth: 1,
  };
};