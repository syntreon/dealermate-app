import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SimpleAIAnalyticsService, type SimpleAIAnalytics, SimpleModelMetrics } from '@/services/simpleAIAnalyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SimpleAIAnalyticsProps {
  startDate?: string;
  endDate?: string;
  clientId?: string | null;
  callType?: 'all' | 'live' | 'test';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SimpleAIAnalytics({ startDate, endDate, clientId, callType = 'all' }: SimpleAIAnalyticsProps) {
  const [data, setData] = useState<SimpleAIAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await SimpleAIAnalyticsService.getSimpleAnalytics(
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate || new Date().toISOString(),
        clientId,
        callType
      );
      
      setData(result);
    } catch (err) {
      console.error('Error fetching AI analytics:', err);
      setError('Failed to load AI analytics data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, clientId, callType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCalls.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total AI Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              LLM + Voice + Transcriber costs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overallErrorRate}%
              <Badge 
                variant={data.overallErrorRate < 5 ? "default" : data.overallErrorRate < 10 ? "secondary" : "destructive"}
                className="ml-2"
              >
                {data.overallErrorRate < 5 ? "Good" : data.overallErrorRate < 10 ? "Fair" : "Poor"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Comparison Tabs */}
      <Tabs defaultValue="llm" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="llm">LLM Models ({data.llmModels.length})</TabsTrigger>
          <TabsTrigger value="voice">Voice Models ({data.voiceModels.length})</TabsTrigger>
          <TabsTrigger value="transcriber">Transcriber Models ({data.transcriberModels.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="llm" className="space-y-4">
          <ModelAnalysisSection models={data.llmModels} title="LLM Model Performance" />
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <ModelAnalysisSection models={data.voiceModels} title="Voice Model Performance" />
        </TabsContent>

        <TabsContent value="transcriber" className="space-y-4">
          <ModelAnalysisSection models={data.transcriberModels} title="Transcriber Model Performance" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ModelAnalysisSectionProps {
  models: SimpleModelMetrics[];
  title: string;
}

function ModelAnalysisSection({ models, title }: ModelAnalysisSectionProps) {
  if (models.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No {title.toLowerCase()} data available for the selected period.
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = models.map(model => ({
    name: model.modelName,
    errorRate: model.errorRate,
    qualityScore: model.avgQualityScore,
    adherenceScore: model.avgAdherenceScore,
    costPerCall: model.avgCostPerCall,
    totalCalls: model.totalCalls
  }));

  const costData = models.map(model => ({
    name: model.modelName,
    cost: parseFloat(model.totalCost.toFixed(2)),
    calls: model.totalCalls
  }));

  return (
    <div className="space-y-4">
      {/* Model Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>{title} - Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Model</th>
                  <th className="text-left p-2">Provider</th>
                  <th className="text-right p-2">Calls</th>
                  <th className="text-right p-2">Error Rate</th>
                  <th className="text-right p-2">Quality Score</th>
                  <th className="text-right p-2">Adherence Score</th>
                  <th className="text-right p-2">Cost/Call</th>
                  <th className="text-right p-2">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{model.modelName}</td>
                    <td className="p-2">{model.provider || '-'}</td>
                    <td className="p-2 text-right">{model.totalCalls.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <Badge 
                        variant={model.errorRate < 5 ? "default" : model.errorRate < 10 ? "secondary" : "destructive"}
                      >
                        {model.errorRate}%
                      </Badge>
                    </td>
                    <td className="p-2 text-right">
                      <span title="Overall conversation quality from lead evaluations">
                        {model.avgQualityScore.toFixed(1)}/10
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span title="How well the AI followed its prompt instructions">
                        {model.avgAdherenceScore.toFixed(1)}/100
                      </span>
                    </td>
                    <td className="p-2 text-right">${model.avgCostPerCall.toFixed(4)}</td>
                    <td className="p-2 text-right">${model.totalCost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-full">
        {/* Error Rate vs Quality Chart */}
        <Card className="w-full max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle>Error Rate vs Quality Score</CardTitle>
          </CardHeader>
          <CardContent className="w-full max-w-full overflow-hidden">
            <div className="w-full h-[300px] overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="errorRate" fill="#FF8042" name="Error Rate %" />
                <Bar dataKey="qualityScore" fill="#0088FE" name="Quality Score" />
              </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Distribution */}
        <Card className="w-full max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle>Cost Distribution by Model</CardTitle>
          </CardHeader>
          <CardContent className="w-full max-w-full overflow-hidden">
            <div className="w-full h-[300px] overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}