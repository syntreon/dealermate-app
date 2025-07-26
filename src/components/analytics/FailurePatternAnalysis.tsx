import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Sector
} from 'recharts';
import { 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  ChevronRight, 
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Search,
  Tag,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  FailurePatternData, 
  FailureCategory, 
  CriticalFailureData,
  ModelFailureBreakdown,
  FailureTrendData,
  KeywordAnalysisData,
  KeywordFrequency,
  FailureCategoryBreakdown
} from '@/types/aiAccuracyAnalytics';

interface FailurePatternAnalysisProps {
  failurePatterns: FailurePatternData;
  keywordAnalysis: KeywordAnalysisData;
  startDate?: string;
  endDate?: string;
  onFilterChange?: (filter: string) => void;
}

const FailurePatternAnalysis: React.FC<FailurePatternAnalysisProps> = ({
  failurePatterns,
  keywordAnalysis,
  startDate,
  endDate,
  onFilterChange
}) => {
  const [activeView, setActiveView] = useState<'categories' | 'keywords' | 'trends'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  // Chart colors - theme aware
  const chartColors = {
    low: 'hsl(var(--info))',
    medium: 'hsl(var(--warning))',
    high: 'hsl(var(--destructive)/0.8)',
    critical: 'hsl(var(--destructive))'
  };

  // Severity badge variants
  const severityVariants: Record<string, string> = {
    low: 'info',
    medium: 'warning',
    high: 'destructive',
    critical: 'destructive'
  };

  // Filter data based on selected category and severity
  const filteredFailures = failurePatterns.commonFailures.filter(failure => {
    if (selectedCategory && failure.category !== selectedCategory) return false;
    if (selectedSeverity && failure.severity !== selectedSeverity) return false;
    return true;
  });

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(
    new Set(failurePatterns.commonFailures.map(failure => failure.category))
  );

  // Get unique severities for filter dropdown
  const uniqueSeverities = Array.from(
    new Set(failurePatterns.commonFailures.map(failure => failure.severity))
  );

  // Custom tooltip for bar charts
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">
                {entry.value} ({entry.payload.percentage}%)
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for line charts
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare data for failure category chart
  const failureCategoryData = filteredFailures.map(failure => ({
    name: failure.category,
    count: failure.count,
    percentage: failure.percentage,
    severity: failure.severity,
    fill: chartColors[failure.severity as keyof typeof chartColors] || chartColors.medium
  }));

  // Prepare data for keyword frequency chart
  const keywordFrequencyData = keywordAnalysis.topFailureKeywords
    .filter(keyword => {
      if (selectedCategory && keyword.category !== selectedCategory) return false;
      return true;
    })
    .slice(0, 15) // Limit to top 15 keywords
    .map((keyword, index) => ({
      name: keyword.keyword,
      count: keyword.frequency,
      category: keyword.category,
      fill: chartColors[keyword.trend === 'increasing' ? 'high' : 'medium']
    }));

  // Prepare data for failure trend chart
  const failureTrendData = failurePatterns.failureTrends.map(trend => {
    const date = new Date(trend.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Create a data point with date and total failures
    const dataPoint: any = {
      date,
      total: trend.totalFailures,
      critical: trend.criticalFailures
    };
    
    // Add model-specific failures
    Object.entries(trend.failuresByModel).forEach(([modelName, count]) => {
      dataPoint[modelName] = count;
    });
    
    return dataPoint;
  });

  // Prepare data for failure by model chart
  const failureByModelData = failurePatterns.failuresByModel.map(model => ({
    name: model.modelName,
    failures: model.totalFailures,
    rate: model.failureRate,
    fill: model.failureRate > 10 ? chartColors.high : chartColors.medium
  }));

  // Prepare data for category breakdown
  const categoryBreakdownData = keywordAnalysis.failureCategories.map(category => ({
    name: category.category,
    value: category.count,
    percentage: category.percentage,
    keywords: category.keywords.slice(0, 5).join(', ') // Show top 5 keywords
  }));

  return (
    <div className="space-y-6">
      {/* View selection tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Failure Categories
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Keyword Analysis
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Failure Trends
          </TabsTrigger>
        </TabsList>

        {/* Failure Categories View */}
        <TabsContent value="categories" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Select value={selectedCategory || 'all'} onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSeverity || 'all'} onValueChange={(value) => setSelectedSeverity(value === 'all' ? null : value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {uniqueSeverities.map(severity => (
                  <SelectItem key={severity} value={severity}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(selectedCategory || selectedSeverity) && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSeverity(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Common Failure Categories Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Common Failure Categories
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {filteredFailures.length} categories
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {failureCategoryData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={failureCategoryData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-muted-foreground text-xs" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        className="text-muted-foreground text-xs"
                        tick={{ fontSize: 12 }}
                        width={150}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name="Occurrences" 
                        radius={[0, 4, 4, 0]}
                      >
                        {failureCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No failure categories found with current filters.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Critical Failures List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Critical Failures
                </CardTitle>
                <Badge variant="destructive" className="text-xs">
                  {failurePatterns.criticalFailures.length} issues
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {failurePatterns.criticalFailures.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {failurePatterns.criticalFailures.map((failure, index) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                          <div>
                            <h4 className="font-medium text-card-foreground">{failure.description}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Occurred {failure.count} times across {failure.affectedModels.length} models
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {failure.affectedModels.map((model, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {model}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          First: {new Date(failure.firstOccurrence).toLocaleDateString()}
                          <br />
                          Last: {new Date(failure.lastOccurrence).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[100px] flex items-center justify-center">
                  <p className="text-muted-foreground">No critical failures found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keyword Analysis View */}
        <TabsContent value="keywords" className="space-y-6 mt-6">
          {/* Keyword Frequency Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Keyword Frequency Analysis
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Top {keywordFrequencyData.length} keywords
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {keywordFrequencyData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={keywordFrequencyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-muted-foreground text-xs" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        className="text-muted-foreground text-xs"
                        tick={{ fontSize: 12 }}
                        width={150}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name="Frequency" 
                        radius={[0, 4, 4, 0]}
                      >
                        {keywordFrequencyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No keywords found with current filters.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Failure Category Breakdown
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {categoryBreakdownData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdownData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryBreakdownData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`hsl(${index * 40 % 360}, 70%, 60%)`} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Category Details */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {categoryBreakdownData.map((category, index) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <h4 className="font-medium text-card-foreground">{category.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.value} occurrences ({category.percentage}%)
                        </p>
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Common keywords:</p>
                          <p className="text-xs font-medium mt-1">{category.keywords}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No category data available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failure Trends View */}
        <TabsContent value="trends" className="space-y-6 mt-6">
          {/* Failure Trends Over Time */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Failure Trends Over Time
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {failureTrendData.length} data points
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {failureTrendData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={failureTrendData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-muted-foreground text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis className="text-muted-foreground text-xs" />
                      <Tooltip content={<CustomLineTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        name="Total Failures"
                        stroke={chartColors.medium} 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="critical" 
                        name="Critical Failures"
                        stroke={chartColors.critical} 
                        strokeWidth={2}
                      />
                      {/* Dynamically add lines for each model */}
                      {Object.keys(failureTrendData[0] || {})
                        .filter(key => !['date', 'total', 'critical'].includes(key))
                        .map((modelName, index) => (
                          <Line
                            key={modelName}
                            type="monotone"
                            dataKey={modelName}
                            name={modelName}
                            stroke={`hsl(${index * 40 % 360}, 70%, 60%)`}
                            strokeWidth={1.5}
                            strokeDasharray="5 5"
                          />
                        ))
                      }
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No trend data available.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Failures by Model */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Failures by Model
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {failureByModelData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={failureByModelData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        className="text-muted-foreground text-xs"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis className="text-muted-foreground text-xs" />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="failures" 
                        name="Total Failures" 
                        fill={chartColors.medium}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="rate" 
                        name="Failure Rate (%)" 
                        fill={chartColors.high}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No model failure data available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FailurePatternAnalysis;
