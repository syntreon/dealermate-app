import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Brain,
  Target,
  AlertTriangle,
  Mic,
  Volume2,
  MessageSquare
} from 'lucide-react';
import { 
  ModelUsageData, 
  AccuracyTrendData, 
  ModelComparisonData 
} from '@/types/aiAccuracyAnalytics';

// Extended interfaces to support multiple model types
interface ExtendedModelUsageData extends ModelUsageData {
  modelType: 'llm' | 'voice' | 'transcriber';
  provider?: string;
}

interface ModelComparisonVisualizationsProps {
  modelsUsed: ModelUsageData[];
  accuracyTrends: AccuracyTrendData[];
  performanceComparison: ModelComparisonData[];
  // Extended data for different model types
  voiceModelsUsed?: ExtendedModelUsageData[];
  transcriberModelsUsed?: ExtendedModelUsageData[];
}

const ModelComparisonVisualizations: React.FC<ModelComparisonVisualizationsProps> = ({
  modelsUsed,
  accuracyTrends,
  performanceComparison,
  voiceModelsUsed = [],
  transcriberModelsUsed = []
}) => {
  const [activeModelType, setActiveModelType] = useState<'llm' | 'voice' | 'transcriber'>('llm');
  // Color palette for charts (theme-aware)
  const chartColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  // Fallback colors for better accessibility
  const fallbackColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316'  // orange
  ];

  const getColorForIndex = (index: number) => {
    return chartColors[index % chartColors.length] || fallbackColors[index % fallbackColors.length];
  };

  // Get current model data based on active tab
  const getCurrentModelData = () => {
    switch (activeModelType) {
      case 'voice':
        return voiceModelsUsed;
      case 'transcriber':
        return transcriberModelsUsed;
      default:
        return modelsUsed;
    }
  };

  // Get model type icon and label
  const getModelTypeInfo = (type: 'llm' | 'voice' | 'transcriber') => {
    switch (type) {
      case 'voice':
        return { icon: Volume2, label: 'Voice Models (TTS)', description: 'Text-to-Speech models for voice generation' };
      case 'transcriber':
        return { icon: Mic, label: 'Transcriber Models (STT)', description: 'Speech-to-Text models for transcription' };
      default:
        return { icon: Brain, label: 'LLM Models', description: 'Large Language Models for conversation' };
    }
  };

  const currentModelData = getCurrentModelData();
  const modelTypeInfo = getModelTypeInfo(activeModelType);

  // Prepare data for model performance comparison bar chart
  const modelPerformanceData = currentModelData.map((model, index) => ({
    name: model.modelName,
    accuracy: model.averageAccuracy,
    quality: model.averageQualityScore,
    adherence: model.averageAdherenceScore,
    failureRate: model.failureRate,
    calls: model.callCount,
    color: getColorForIndex(index),
    provider: (model as ExtendedModelUsageData).provider
  }));

  // Prepare data for accuracy trends line chart
  const accuracyTrendData = accuracyTrends.map(trend => {
    const dataPoint: any = {
      date: new Date(trend.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      overall: trend.overallAccuracy
    };

    // Add model-specific accuracy data
    Object.entries(trend.modelAccuracies).forEach(([modelName, accuracy]) => {
      dataPoint[modelName] = accuracy;
    });

    return dataPoint;
  });

  // Prepare data for model usage distribution pie chart
  const usageDistributionData = currentModelData.map((model, index) => ({
    name: model.modelName,
    value: model.usagePercentage,
    calls: model.callCount,
    fill: getColorForIndex(index),
    provider: (model as ExtendedModelUsageData).provider
  }));

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
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
              <span className="text-muted-foreground">{entry.dataKey}:</span>
              <span className="font-medium text-foreground">
                {entry.dataKey === 'failureRate' ? `${entry.value.toFixed(1)}%` : `${entry.value.toFixed(1)}`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for line chart
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
              <span className="text-muted-foreground">{entry.dataKey}:</span>
              <span className="font-medium text-foreground">{entry.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value.toFixed(1)}% ({data.calls} calls)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Get performance trend indicator
  const getPerformanceTrend = (current: number, threshold: number) => {
    if (current >= threshold) {
      return {
        icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
        text: 'Above Target',
        color: 'text-emerald-600'
      };
    }
    return {
      icon: <TrendingDown className="h-4 w-4 text-amber-500" />,
      text: 'Below Target',
      color: 'text-amber-600'
    };
  };

  return (
    <div className="space-y-6">
      {/* Model Type Tabs */}
      <Tabs value={activeModelType} onValueChange={(value) => setActiveModelType(value as 'llm' | 'voice' | 'transcriber')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="llm" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            LLM Models
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Voice Models
          </TabsTrigger>
          <TabsTrigger value="transcriber" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Transcriber Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeModelType} className="space-y-6 mt-6">
          {/* Model Performance Comparison Bar Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                    <modelTypeInfo.icon className="h-5 w-5 text-primary" />
                    {modelTypeInfo.label} Performance Comparison
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{modelTypeInfo.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {currentModelData.length} model{currentModelData.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {modelPerformanceData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={modelPerformanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                  />
                  <Bar 
                    dataKey="accuracy" 
                    name="Accuracy Score"
                    fill={chartColors[0]}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="quality" 
                    name="Quality Score"
                    fill={chartColors[1]}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="adherence" 
                    name="Adherence Score"
                    fill={chartColors[2]}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>) : (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No model performance data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accuracy Trends Over Time Line Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Accuracy Trends Over Time
            </CardTitle>
            <div className="flex items-center gap-2">
              {accuracyTrends.length > 0 && (
                <>
                  {getPerformanceTrend(
                    accuracyTrends[accuracyTrends.length - 1]?.overallAccuracy || 0, 
                    8.0
                  ).icon}
                  <Badge variant="outline" className="text-xs">
                    {accuracyTrends.length} data points
                  </Badge>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {accuracyTrendData.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={accuracyTrendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 10]}
                    className="text-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="overall"
                    name="Overall Accuracy"
                    stroke={chartColors[0]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  {/* Add lines for each model */}
                  {modelsUsed.map((model, index) => (
                    <Line
                      key={model.modelName}
                      type="monotone"
                      dataKey={model.modelName}
                      name={model.modelName}
                      stroke={getColorForIndex(index + 1)}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      strokeDasharray={index > 0 ? "5 5" : undefined}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No accuracy trend data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Usage Distribution Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Model Usage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usageDistributionData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usageDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usageDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No usage distribution data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelsUsed.map((model, index) => {
                const trend = getPerformanceTrend(model.averageAccuracy, 8.0);
                return (
                  <div 
                    key={model.modelName} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getColorForIndex(index) }}
                      />
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {model.modelName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {model.callCount} calls ({model.usagePercentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {model.averageAccuracy.toFixed(1)}
                        </span>
                        {trend.icon}
                      </div>
                      <p className={`text-xs ${trend.color}`}>
                        {trend.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelComparisonVisualizations;