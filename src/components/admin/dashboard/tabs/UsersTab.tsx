import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Activity, UserPlus, Clock, Shield, User, AlertCircle, RefreshCw } from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { User as UserType, Client } from '@/types/admin';
import { getRoleLabel } from '@/utils/roleLabels'; // Centralized role label mapping
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

interface UsersTabProps {
  // No props needed - component fetches its own data
}

interface UserDistribution {
  role: string;
  count: number;
  percentage: number;
  color: string;
}

interface UserActivityMetrics {
  activeUsersToday: number;
  newUsersThisMonth: number;
  totalUsers: number;
  usersWithRecentActivity: number; // Last 7 days
  averageLoginFrequency: number; // Days between logins
}

export const UsersTab: React.FC<UsersTabProps> = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [userDistribution, setUserDistribution] = useState<UserDistribution[]>([]);
  const [activityMetrics, setActivityMetrics] = useState<UserActivityMetrics | null>(null);
  const [recentUsers, setRecentUsers] = useState<UserType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users and clients
      const [allUsers, allClients] = await Promise.all([
        AdminService.getUsers(),
        AdminService.getClients()
      ]);
      setUsers(allUsers);
      setClients(allClients);

      // Calculate user distribution by role
      const distribution = calculateUserDistribution(allUsers);
      setUserDistribution(distribution);

      // Calculate activity metrics
      const metrics = calculateActivityMetrics(allUsers);
      setActivityMetrics(metrics);

      // Get recent users (joined in last 30 days)
      const recent = allUsers
        .filter(user => {
          const joinedDate = new Date(user.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return joinedDate >= thirtyDaysAgo;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10); // Show top 10 recent users

      setRecentUsers(recent);
    } catch (err) {
      console.error('Error fetching user data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateUserDistribution = (users: UserType[]): UserDistribution[] => {
    const roleCounts: Record<string, number> = {};
    
    // Count users by role
    users.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });

    const totalUsers = users.length;
    
    // Define role colors only; use getRoleLabel for display name
    const roleConfig: Record<string, { color: string }> = {
      owner: { color: 'text-violet-600 dark:text-violet-400' },
      admin: { color: 'text-emerald-600 dark:text-emerald-400' },
      user: { color: 'text-blue-600 dark:text-blue-400' },
      client_admin: { color: 'text-amber-600 dark:text-amber-400' },
      client_user: { color: 'text-slate-600 dark:text-slate-400' }
    };

    // Use getRoleLabel for display name
    return Object.entries(roleCounts)
      .map(([role, count]) => ({
        role: getRoleLabel(role),
        count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
        color: roleConfig[role]?.color || 'text-muted-foreground'
      }))
      .sort((a, b) => b.count - a.count);
  };

  const calculateActivityMetrics = (users: UserType[]): UserActivityMetrics => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Active users today (logged in today)
    const activeUsersToday = users.filter(user => {
      if (!user.last_login_at) return false;
      const lastLogin = new Date(user.last_login_at);
      return lastLogin >= today;
    }).length;

    // New users this month
    const newUsersThisMonth = users.filter(user => {
      const createdAt = new Date(user.created_at);
      return createdAt >= thisMonth;
    }).length;

    // Users with recent activity (last 7 days)
    const usersWithRecentActivity = users.filter(user => {
      if (!user.last_login_at) return false;
      const lastLogin = new Date(user.last_login_at);
      return lastLogin >= sevenDaysAgo;
    }).length;

    // Calculate average login frequency (simplified)
    const usersWithLogins = users.filter(user => user.last_login_at);
    const avgLoginFrequency = usersWithLogins.length > 0 
      ? Math.round(usersWithLogins.reduce((acc, user) => {
          const daysSinceCreated = Math.max(1, Math.floor((now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)));
          const daysSinceLastLogin = user.last_login_at 
            ? Math.floor((now.getTime() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60 * 24))
            : daysSinceCreated;
          return acc + Math.min(daysSinceLastLogin, daysSinceCreated);
        }, 0) / usersWithLogins.length)
      : 0;

    return {
      activeUsersToday,
      newUsersThisMonth,
      totalUsers: users.length,
      usersWithRecentActivity,
      averageLoginFrequency: avgLoginFrequency
    };
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'owner': return 'destructive';
      case 'admin': return 'default';
      case 'client_admin': return 'secondary';
      default: return 'outline';
    }
  };

  const getBusinessName = (clientId: string | null): string => {
    if (!clientId) return 'DealerMate';
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const handleRetry = () => {
    fetchUserData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeletons */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Failed to Load User Data</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 6.1 User Distribution by Role */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Users className="h-5 w-5" />
              User Distribution by Role
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Breakdown of users by role and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userDistribution.length > 0 ? (
              userDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-card-foreground">{item.role}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                      <span className={`text-sm font-medium ${item.color}`}>{item.percentage}%</span>
                    </div>
                  </div>
                  <Progress 
                    value={item.percentage} 
                    className="h-2" 
                  />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No user data available</p>
            )}
          </CardContent>
        </Card>

        {/* 6.2 User Activity Metrics */}
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Activity className="h-5 w-5" />
              User Activity Metrics
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Login frequency and engagement statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityMetrics ? (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-card-foreground">Active Today</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {activityMetrics.activeUsersToday}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-card-foreground">New This Month</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {activityMetrics.newUsersThisMonth}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-card-foreground">Active Last 7 Days</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {activityMetrics.usersWithRecentActivity}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-sm font-medium text-card-foreground">Total Users</span>
                  </div>
                  <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                    {activityMetrics.totalUsers}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">No activity data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6.3 Recent User Activity Section */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <User className="h-5 w-5" />
            Recent User Activity
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Users who joined in the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
        {recentUsers.length > 0 ? (
          isMobile ? (
            // Mobile: Card layout
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-card-foreground">{user.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {/* Use getRoleLabel for consistent, centralized role display */}
                    <Badge variant={getRoleVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business:</span>
                      <p className="text-card-foreground font-medium">{getBusinessName(user.client_id)}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined:</span>
                      <p className="text-card-foreground">{formatDate(user.created_at)}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Login:</span>
                      <p className="text-card-foreground">{user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Table layout
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Business</TableHead>
                  <TableHead className="text-muted-foreground">Joined</TableHead>
                  <TableHead className="text-muted-foreground">Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell className="font-medium text-card-foreground">
                      {user.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {/* Use getRoleLabel for consistent, centralized role display */}
                      <Badge variant={getRoleVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-card-foreground">
                      {getBusinessName(user.client_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">No Recent Users</h3>
            <p className="text-muted-foreground">No users have joined in the last 30 days.</p>
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
  


  // Render main component content
  return (
  <div className="space-y-6">
    {/* 6.1 User Distribution by Role */}
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Users className="h-5 w-5" />
            User Distribution by Role
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Breakdown of users by role and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userDistribution.length > 0 ? (
            userDistribution.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-card-foreground">{item.role}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                    <span className={`text-sm font-medium ${item.color}`}>{item.percentage}%</span>
                  </div>
                </div>
                <Progress 
                  value={item.percentage} 
                  className="h-2" 
                />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No user data available</p>
          )}
        </CardContent>
      </Card>

      {/* 6.2 User Activity Metrics */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Activity className="h-5 w-5" />
            User Activity Metrics
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Login frequency and engagement statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activityMetrics ? (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-card-foreground">Active Today</span>
                </div>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {activityMetrics.activeUsersToday}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-card-foreground">New This Month</span>
                </div>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {activityMetrics.newUsersThisMonth}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-card-foreground">Active Last 7 Days</span>
                </div>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {activityMetrics.usersWithRecentActivity}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-medium text-card-foreground">Total Users</span>
                </div>
                <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  {activityMetrics.totalUsers}
                </span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">No activity data available</p>
          )}
        </CardContent>
      </Card>
    </div>

    {/* 6.3 Recent User Activity Section */}
    <Card className="bg-card text-card-foreground border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <User className="h-5 w-5" />
          Recent User Activity
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Users who joined in the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentUsers.length > 0 ? (
          isMobile ? (
            // Mobile: Card layout
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-card-foreground">{user.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {/* Use getRoleLabel for consistent, centralized role display */}
                    <Badge variant={getRoleVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business:</span>
                      <p className="text-card-foreground font-medium">{getBusinessName(user.client_id)}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined:</span>
                      <p className="text-card-foreground">{formatDate(user.created_at)}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Login:</span>
                      <p className="text-card-foreground">{user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Table layout
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Business</TableHead>
                  <TableHead className="text-muted-foreground">Joined</TableHead>
                  <TableHead className="text-muted-foreground">Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell className="font-medium text-card-foreground">
                      {user.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {/* Use getRoleLabel for consistent, centralized role display */}
                      <Badge variant={getRoleVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-card-foreground">
                      {getBusinessName(user.client_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">No Recent Users</h3>
            <p className="text-muted-foreground">No users have joined in the last 30 days.</p>
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
};