import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';

interface CallVolumeHeatmapProps {
  data: Array<{
    day: number; // 0-6 (Sunday-Saturday)
    hour: number; // 0-23
    count: number;
  }>;
  maxCount?: number;
}

const CallVolumeHeatmap: React.FC<CallVolumeHeatmapProps> = ({ data, maxCount: propMaxCount }) => {
  // Calculate max count if not provided
  const maxCount = useMemo(() => {
    if (propMaxCount) return propMaxCount;
    // Handle empty data array case
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(item => item.count), 1);
  }, [data, propMaxCount]);

  // Generate color intensity based on count
  const getColorIntensity = (count: number) => {
    if (count === 0) return 'bg-card border border-border';
    
    const intensity = Math.min(Math.floor((count / maxCount) * 100), 100);
    
    // Different color intensities based on the count relative to max
    if (intensity > 75) {
      return 'bg-primary'; // Highest intensity
    } else if (intensity > 50) {
      return 'bg-primary/80';
    } else if (intensity > 25) {
      return 'bg-primary/60';
    } else if (intensity > 10) {
      return 'bg-primary/40';
    } else {
      return 'bg-primary/20'; // Lowest intensity
    }
  };

  // Create a 2D array for the heatmap (day x hour)
  const heatmapData = useMemo(() => {
    // Initialize with zeros
    const grid: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
    
    // Fill with actual data if available
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        if (item && typeof item.day === 'number' && typeof item.hour === 'number' && 
            item.day >= 0 && item.day < 7 && item.hour >= 0 && item.hour < 24) {
          grid[item.day][item.hour] = item.count || 0;
        }
      });
    }
    
    return grid;
  }, [data]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Show 2-hour intervals for the full day (12 columns), starting from 6am
  const displayHours = [
    6, 8, 10, 12, 14, 16, 18, 20, 22, 0, 2, 4
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Volume by Hour/Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Legend */}
            <div className="flex justify-end mb-2 gap-2">
              <div className="flex items-center text-xs">
                <span className="w-3 h-3 inline-block mr-1 bg-primary/20"></span>
                <span>Low</span>
              </div>
              <div className="flex items-center text-xs">
                <span className="w-3 h-3 inline-block mr-1 bg-primary/60"></span>
                <span>Medium</span>
              </div>
              <div className="flex items-center text-xs">
                <span className="w-3 h-3 inline-block mr-1 bg-primary"></span>
                <span>High</span>
              </div>
            </div>
            
            {/* Hours header */}
            <div className="flex">
              <div className="w-16"></div> {/* Empty corner cell */}
              {displayHours.map(hour => (
                <div key={hour} className="flex-1 text-center text-xs font-medium text-muted-foreground">
                  {hour === 0 ? '12 am' : 
                   hour === 12 ? '12 pm' : 
                   hour < 12 ? `${hour} am` : 
                   `${hour-12} pm`}
                </div>
              ))}
            </div>
            
            {/* Heatmap grid */}
            {daysOfWeek.map((day, dayIndex) => (
              <div key={day} className="flex h-10 mt-1">
                <div className="w-16 flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground">
                  {day}
                </div>
                {displayHours.map(hour => {
                  // For each 2-hour interval, calculate the sum of calls in that interval
                  let count = 0;
                  for (let h = hour; h < hour + 2 && h < 24; h++) {
                    count += heatmapData[dayIndex][h] || 0;
                  }
                  
                  // Format the time range for the tooltip
                  const startHour = hour === 0 ? '12 am' : hour === 12 ? '12 pm' : hour < 12 ? `${hour} am` : `${hour-12} pm`;
                  const endHour = (hour+2) === 12 ? '12 pm' : (hour+2) === 24 ? '12 am' : (hour+2) < 12 ? `${hour+2} am` : `${(hour+2)-12} pm`;
                  
                  return (
                    <div 
                      key={`${day}-${hour}`}
                      className={`flex-1 mx-0.5 flex items-center justify-center ${getColorIntensity(count)} rounded h-8`}
                      title={`${day} ${startHour}-${endHour}: ${count} calls`}
                    >
                      {count > 0 && (
                        <span className="text-xs font-medium text-card-foreground">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Volume indicators */}
            <div className="flex justify-between mt-4">
              <div className="text-xs text-muted-foreground">
                Filter: <span className="font-medium">Full Day (6am-6am)</span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-xs text-muted-foreground">200+ calls</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary/60"></span>
                  <span className="text-xs text-muted-foreground">100+ calls</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary/20"></span>
                  <span className="text-xs text-muted-foreground">50+ calls</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CallVolumeHeatmap;
