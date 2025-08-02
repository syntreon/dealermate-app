import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Types for the filter props
export interface CallLogsAdvancedFilters {
  minScore?: number; // Minimum evaluation score (1-5)
  maxScore?: number; // Maximum evaluation score (1-5)
  sentiment?: 'positive' | 'neutral' | 'negative' | '__all__';
  inquiryType?: string | '__all__'; // One of: sales, service, general, other
  reviewRequired?: boolean;
}

interface CallLogsAdvancedFilterProps {
  filters: CallLogsAdvancedFilters;
  onFilterChange: (filters: CallLogsAdvancedFilters) => void;
  // Now static options, not passed in
}

const INQUIRY_TYPE_OPTIONS = ['purchase', 'service', 'general', 'other'];

/**
 * Minimal, modular advanced filter UI for CallLogsTable
 * Filters: Evaluation Score (range), Sentiment, Inquiry Type, Review Required
 */
const CallLogsAdvancedFilter: React.FC<CallLogsAdvancedFilterProps> = ({
  filters,
  onFilterChange,
}) => {
  // Local state for advanced panel toggle
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Helper: count active advanced filters
  const advancedFilterCount =
    (filters.minScore ? 1 : 0) +
    (filters.maxScore ? 1 : 0) +
    (filters.sentiment && filters.sentiment !== '__all__' ? 1 : 0) +
    (filters.inquiryType && filters.inquiryType !== '__all__' ? 1 : 0) +
    (filters.reviewRequired ? 1 : 0);

  // Update a single filter field
  const handleChange = (key: keyof CallLogsAdvancedFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  // --- Main filter row (minimal) ---
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 items-end">
        {/* (Optional) Add search or quick filter here if needed */}
        {/* Advanced Toggle Button */}
        <button
          type="button"
          className={`flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-background text-xs hover:bg-muted transition ${showAdvanced ? 'bg-muted' : ''}`}
          onClick={() => setShowAdvanced(v => !v)}
          aria-expanded={showAdvanced}
        >
          <span>Advanced</span>
          {advancedFilterCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">{advancedFilterCount}</span>
          )}
        </button>
      </div>

      {/* --- Advanced Panel --- */}
      {showAdvanced && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded bg-muted/50 border border-border">
          {/* Score Range */}
          <div>
            <Label htmlFor="minScore">Score</Label>
            <div className="flex gap-2">
              <Input
                id="minScore"
                type="number"
                min={1}
                max={5}
                placeholder="Min"
                value={filters.minScore ?? ''}
                onChange={e => handleChange('minScore', e.target.value ? Number(e.target.value) : undefined)}
                className="w-16"
              />
              <span>-</span>
              <Input
                id="maxScore"
                type="number"
                max={5}
                placeholder="Max"
                value={filters.maxScore ?? ''}
                onChange={e => handleChange('maxScore', e.target.value ? Number(e.target.value) : undefined)}
                className="w-16"
              />
            </div>
          </div>

          {/* Sentiment Filter */}
          <div>
            <Label htmlFor="sentiment">Sentiment</Label>
            <Select
              value={filters.sentiment || '__all__'}
              onValueChange={val => handleChange('sentiment', val)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inquiry Type Filter: sales, service, general, other */}
          <div>
            <Label htmlFor="inquiryType">Inquiry Type</Label>
            <Select
              value={filters.inquiryType || '__all__'}
              onValueChange={val => handleChange('inquiryType', val)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {INQUIRY_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Review Required Filter */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="reviewRequired"
              checked={!!filters.reviewRequired}
              onCheckedChange={checked => handleChange('reviewRequired', !!checked)}
            />
            <Label htmlFor="reviewRequired">Review Required</Label>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallLogsAdvancedFilter;
