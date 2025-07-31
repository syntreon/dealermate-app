import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, BarChart3, Users, Calendar, Phone, Mail, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { Client } from '@/types/admin';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Local date formatting function
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Normalize plan names to handle typos and variations
const normalizePlanName = (plan: string): string => {
  const normalized = plan.toLowerCase().trim();
  
  // Handle common typos and variations
  if (normalized === 'free trail' || normalized === 'free trial') {
    return 'Free Trial';
  }
  
  // Capitalize first letter of each word for other plans
  return plan.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

interface ClientsTabProps {
  // No props needed - component fetches its own data
}

interface ClientStatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface SubscriptionPlanDistribution {
  plan: string;
  count: number;
  percentage: number;
  totalRevenue: number;
  color: string;
}

export const ClientsTab: React.FC<ClientsTabProps> = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<ClientStatusDistribution[]>([]);
  const [planDistribution, setPlanDistribution] = useState<SubscriptionPlanDistribution[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchClientsData();
  }, []);

  const fetchClientsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all clients data
      const allClients = await AdminService.getClients();
      setClients(allClients);

      // Process status distribution
      const statusCounts = allClients.reduce((acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalClients = allClients.length;
      const statusDist: ClientStatusDistribution[] = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: totalClients > 0 ? (count / totalClients) * 100 : 0,
        color: getStatusColor(status)
      })).sort((a, b) => b.count - a.count);

      setStatusDistribution(statusDist);

      // Process subscription plan distribution
      const planCounts = allClients.reduce((acc, client) => {
        const rawPlan = client.subscription_plan || 'Unknown';
        const plan = normalizePlanName(rawPlan);
        if (!acc[plan]) {
          acc[plan] = { count: 0, revenue: 0 };
        }
        acc[plan].count += 1;
        acc[plan].revenue += client.monthly_billing_amount_cad || 0;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const planDist: SubscriptionPlanDistribution[] = Object.entries(planCounts).map(([plan, data]) => ({
        plan,
        count: data.count,
        percentage: totalClients > 0 ? (data.count / totalClients) * 100 : 0,
        totalRevenue: data.revenue,
        color: getPlanColor(plan)
      })).sort((a, b) => b.count - a.count);

      setPlanDistribution(planDist);

      // Get recent clients (last 30 days, sorted by joined_at)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recent = allClients
        .filter(client => new Date(client.joined_at) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
        .slice(0, 10); // Show top 10 recent clients

      setRecentClients(recent);
    } catch (err) {
      console.error('Error fetching clients data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clients data';
      setError(errorMessage);
      toast({
        title: 'Error Loading Clients Data',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get status colors using theme-aware classes
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'inactive':
        return 'text-slate-600 dark:text-slate-400';
      case 'trial':
        return 'text-amber-600 dark:text-amber-400';
      case 'churned':
        return 'text-destructive';
      case 'pending':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  };

  // Helper function to get plan colors using theme-aware classes
  // Returns the theme-aware color class for a given subscription plan
const getPlanColor = (plan: string): string => {
    switch (plan.toLowerCase()) {
      case 'free trial':
        return 'text-amber-600 dark:text-amber-400';
      case 'basic':
        return 'text-blue-600 dark:text-blue-400';
      case 'pro':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'custom':
        return 'text-violet-600 dark:text-violet-400';
      case 'unknown':
        return 'text-slate-600 dark:text-slate-400';
      default:
        return 'text-muted-foreground';
    }
  };

  // Helper function to get status badge variant
  // Returns the badge variant for a given client status for consistent theming
const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'trial':
        return 'secondary';
      case 'churned':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-card text-card-foreground border-border">
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-2 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center text-center py-8">
              <div className="space-y-2">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                <h3 className="text-lg font-semibold text-foreground">Error Loading Clients Data</h3>
                <p className="text-muted-foreground">{error}</p>
                <button
                  onClick={fetchClientsData}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 5.1 Client Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5" />
              Client Status Distribution
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Breakdown of {formatNumber(clients.length)} clients by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <div className="space-y-4">
                {statusDistribution.map((item) => (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${item.color}`}>
                        {item.status}
                      </span>
                      <span className="text-muted-foreground">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No client data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="h-5 w-5" />
              Subscription Plans
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Distribution by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            {planDistribution.length > 0 ? (
              <div className="space-y-4">
                {planDistribution.map((item) => (
                  <div key={item.plan} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${item.color}`}>
                        {item.plan}
                      </span>
                      <div className="text-right">
                        <div className="text-muted-foreground">
                          {item.count} clients ({item.percentage.toFixed(1)}%)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.totalRevenue)} CAD/month
                        </div>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No subscription data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5.2 Recent Client Activity */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5" />
            Recent Client Activity
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Clients who joined in the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentClients.length > 0 ? (
            isMobile ? (
              // Mobile card layout
              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div key={client.id} className="p-4 border border-border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{client.name}</h4>
                      <Badge variant={getStatusBadgeVariant(client.status)}>
                        {client.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Plan:</span>
                        <span className="ml-1 text-foreground">{client.subscription_plan}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Revenue:</span>
                        <span className="ml-1 text-foreground">{formatCurrency(client.monthly_billing_amount_cad)} CAD</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="ml-1 text-foreground">{formatDate(client.joined_at)}</span>
                    </div>
                    {client.contact_person && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="ml-1 text-foreground">{client.contact_person}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Desktop table layout
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monthly Revenue</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Joined Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(client.status)}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.subscription_plan}</TableCell>
                      <TableCell>{formatCurrency(client.monthly_billing_amount_cad)} CAD</TableCell>
                      <TableCell>
                        {client.contact_person ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-3 w-3" />
                              {client.contact_person}
                            </div>
                            {client.contact_email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {client.contact_email}
                              </div>
                            )}
                            {client.phone_number && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {client.phone_number}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(client.joined_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Recent Activity</h3>
              <p className="text-muted-foreground">No clients have joined in the last 30 days</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};