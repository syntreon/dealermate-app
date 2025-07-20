import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Calculator } from 'lucide-react';

interface FinancialTabProps {
  // Props will be added when implementing task 4
}

export const FinancialTab: React.FC<FinancialTabProps> = () => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <PieChart className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Monthly operational costs by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Financial analysis will be implemented in task 4</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calculator className="h-5 w-5" />
              Profitability Analysis
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Revenue vs costs breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Profitability analysis will be implemented in task 4</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};