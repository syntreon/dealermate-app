import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { User } from '@/types/admin';

interface UserActivityChartProps {
  users: User[];
  timeframe?: 'daily' | 'weekly' | 'monthly';
}

// Theme-aware color palette using CSS variables
const colors = {
  logins: 'var(--primary)',
  calls: 'var(--secondary)',
  leads: 'var(--accent)',
};

// This component displays user activity metrics in a bar chart
export const UserActivityChart: React.FC<UserActivityChartProps> = ({ 
  users, 
  timeframe = 'weekly' 
}) => {
  // Use React.useMemo to stabilize data generation
  const activityData = React.useMemo(() => {
    // In a real implementation, this would process actual user activity data
    // For now, we'll generate sample data based on the users array
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Use a fixed seed for consistent random numbers
    const generateSeededRandom = (seed: number) => {
      return () => {
        // Simple seeded random function
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    };
    
    // Create a seeded random generator with a fixed seed
    const seededRandom = generateSeededRandom(123456);
    
    return daysOfWeek.map((day, index) => {
      // Generate consistent data based on index
      const userCount = users.length;
      const baseLogins = Math.floor(userCount * 0.7);
      const baseCalls = Math.floor(userCount * 0.5);
      const baseLeads = Math.floor(baseCalls * 0.3);
      
      // Use seeded random for consistent variance
      const loginVariance = Math.floor(seededRandom() * (userCount * 0.3));
      const callVariance = Math.floor(seededRandom() * (userCount * 0.2));
      const leadVariance = Math.floor(seededRandom() * (baseCalls * 0.2));
      
      return {
        name: day,
        logins: Math.max(0, baseLogins + loginVariance),
        calls: Math.max(0, baseCalls + callVariance),
        leads: Math.max(0, baseLeads + leadVariance),
      };
    });
  }, [users.length]); // Only recalculate when users.length changes

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle className="text-lg font-medium">User Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={activityData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs text-muted-foreground" />
            <YAxis className="text-xs text-muted-foreground" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--card)', 
                borderColor: 'var(--border)',
                borderRadius: '6px',
                color: 'var(--foreground)'
              }} 
            />
            <Legend />
            <Bar dataKey="logins" name="Logins" fill={colors.logins} radius={[4, 4, 0, 0]} />
            <Bar dataKey="calls" name="Calls" fill={colors.calls} radius={[4, 4, 0, 0]} />
            <Bar dataKey="leads" name="Leads" fill={colors.leads} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
