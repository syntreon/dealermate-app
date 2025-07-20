import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Globe } from 'lucide-react';
import { Client } from '@/types/admin';
import { formatNumber } from '@/utils/formatting';

interface GeographicDistributionProps {
  clients: Client[];
}

export const GeographicDistribution: React.FC<GeographicDistributionProps> = ({ clients }) => {
  // Extract geographic data from clients (mock implementation)
  // In a real app, you'd have proper geographic data
  const getGeographicData = () => {
    const regions = [
      { name: 'North America', count: 0, color: 'bg-blue-500' },
      { name: 'Europe', count: 0, color: 'bg-green-500' },
      { name: 'Asia Pacific', count: 0, color: 'bg-purple-500' },
      { name: 'Other', count: 0, color: 'bg-gray-500' }
    ];

    // Mock distribution based on client names/types
    clients.forEach(client => {
      // Simple mock logic - in reality you'd have proper geographic data
      const random = Math.random();
      if (random < 0.6) {
        regions[0].count++; // North America
      } else if (random < 0.8) {
        regions[1].count++; // Europe
      } else if (random < 0.95) {
        regions[2].count++; // Asia Pacific
      } else {
        regions[3].count++; // Other
      }
    });

    return regions.filter(region => region.count > 0);
  };

  const getCityData = () => {
    // Mock city distribution
    const cities = [
      { name: 'Toronto', count: Math.floor(clients.length * 0.25) },
      { name: 'Vancouver', count: Math.floor(clients.length * 0.20) },
      { name: 'Montreal', count: Math.floor(clients.length * 0.15) },
      { name: 'Calgary', count: Math.floor(clients.length * 0.12) },
      { name: 'Ottawa', count: Math.floor(clients.length * 0.10) },
      { name: 'Other', count: clients.length - Math.floor(clients.length * 0.82) }
    ];

    return cities.filter(city => city.count > 0).slice(0, 5);
  };

  const regionData = getGeographicData();
  const cityData = getCityData();
  const totalClients = clients.length;

  if (totalClients === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Geographic Distribution
          </CardTitle>
          <CardDescription>Client distribution by location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No geographic data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Geographic Distribution
        </CardTitle>
        <CardDescription>Client distribution by location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Regional Distribution */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">By Region</h4>
          <div className="space-y-2">
            {regionData.map((region) => {
              const percentage = totalClients > 0 ? (region.count / totalClients) * 100 : 0;
              return (
                <div key={region.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${region.color}`}></div>
                      <span className="text-sm">{region.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{formatNumber(region.count)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* City Distribution */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Top Cities
          </h4>
          <div className="space-y-2">
            {cityData.map((city, index) => {
              const percentage = totalClients > 0 ? (city.count / totalClients) * 100 : 0;
              return (
                <div key={city.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{city.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatNumber(city.count)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {regionData.length}
              </div>
              <div className="text-xs text-muted-foreground">Regions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {cityData.length}
              </div>
              <div className="text-xs text-muted-foreground">Cities</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};