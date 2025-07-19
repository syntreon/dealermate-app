import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  Building2,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  Settings,
  Users,
  BarChart
} from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { Client } from '@/types/admin';
import ClientForm from '@/components/admin/clients/ClientForm';
import { formatCurrency, formatDate, formatPercentage } from '@/utils/formatters';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const loadClient = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await AdminService.getClientById(id);
        if (data) {
          setClient(data);
        } else {
          toast({
            title: 'Error',
            description: 'Client not found',
            variant: 'destructive',
          });
          navigate('/admin/clients');
        }
      } catch (error) {
        console.error('Failed to load client:', error);
        toast({
          title: 'Error',
          description: 'Failed to load client details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadClient();
  }, [id, navigate, toast]);

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!client) return;

    try {
      await AdminService.deleteClientWithAudit(client.id);
      toast({
        title: 'Client Deleted',
        description: `${client.name} has been deleted successfully.`,
      });
      navigate('/admin/clients');
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleActivate = async () => {
    if (!client) return;

    try {
      const updatedClient = await AdminService.activateClientWithAudit(client.id);
      setClient(updatedClient);
      toast({
        title: 'Client Activated',
        description: `${client.name} has been activated successfully.`,
      });
    } catch (error) {
      console.error('Failed to activate client:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate client. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivate = async () => {
    if (!client) return;

    try {
      const updatedClient = await AdminService.deactivateClientWithAudit(client.id);
      setClient(updatedClient);
      toast({
        title: 'Client Deactivated',
        description: `${client.name} has been deactivated successfully.`,
      });
    } catch (error) {
      console.error('Failed to deactivate client:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate client. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!client) return;

    setIsSubmitting(true);
    try {
      const updatedClient = await AdminService.updateClientWithAudit(client.id, data);
      setClient(updatedClient);
      toast({
        title: 'Client Updated',
        description: `${updatedClient.name} has been updated successfully.`,
      });
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to update client:', error);
      toast({
        title: 'Error',
        description: 'Failed to update client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Client not found</p>
            <Button className="mt-4" onClick={() => navigate('/admin/clients')}>
              Return to Client List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/clients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>
      </div>

      {/* Client header with actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {client.name}
              {getStatusBadge(client.status)}
            </h1>
            <p className="text-muted-foreground">
              {client.type} · {client.subscription_plan} · ID: {client.id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {client.status !== 'active' && (
            <Button variant="outline" size="sm" onClick={handleActivate} className="text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate
            </Button>
          )}

          {client.status !== 'inactive' && (
            <Button variant="outline" size="sm" onClick={handleDeactivate} className="text-red-600">
              <XCircle className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Client details tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{client.metrics?.totalCalls.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {client.metrics?.callsToday || 0} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{client.metrics?.totalLeads.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {client.metrics?.leadsToday || 0} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Call Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {client.metrics?.avgCallDuration ? `${Math.floor(client.metrics.avgCallDuration / 60)}m ${client.metrics.avgCallDuration % 60}s` : '0s'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {client.metrics?.totalCalls && client.metrics.totalCalls > 0
                    ? `${((client.metrics.totalLeads / client.metrics.totalCalls) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calls to leads
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Contact Person</p>
                      <p className="text-muted-foreground">{client.contact_person || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">
                        {client.contact_email ? (
                          <a href={`mailto:${client.contact_email}`} className="text-primary hover:underline">
                            {client.contact_email}
                          </a>
                        ) : (
                          'Not specified'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">
                        {client.phone_number ? (
                          <a href={`tel:${client.phone_number}`} className="text-primary hover:underline">
                            {client.phone_number}
                          </a>
                        ) : (
                          'Not specified'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Billing Address</p>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {client.billing_address || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Joined Date</p>
                      <p className="text-muted-foreground">
                        {formatDate(client.joined_at, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Last Active</p>
                      <p className="text-muted-foreground">
                        {client.last_active_at
                          ? formatDate(client.last_active_at, { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Billing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Monthly Billing Amount</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(client.monthly_billing_amount_cad, 'CAD')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Average Monthly AI Cost</p>
                      <p className="text-muted-foreground">
                        {formatCurrency(client.average_monthly_ai_cost_usd, 'USD')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Average Monthly Misc Cost</p>
                      <p className="text-muted-foreground">
                        {formatCurrency(client.average_monthly_misc_cost_usd, 'USD')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Percent className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Partner Split Percentage</p>
                      <p className="text-muted-foreground">
                        {formatPercentage(client.partner_split_percentage)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Finder's Fee</p>
                      <p className="text-muted-foreground">
                        {formatCurrency(client.finders_fee_cad, 'CAD')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Estimated Monthly Profit</p>
                      <p className="text-muted-foreground">
                        {formatCurrency(
                          client.monthly_billing_amount_cad -
                          (client.average_monthly_ai_cost_usd + client.average_monthly_misc_cost_usd) * 1.35 -
                          (client.monthly_billing_amount_cad * client.partner_split_percentage / 100),
                          'CAD'
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (Assuming USD/CAD exchange rate of 1.35)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Configuration JSON</p>
                    <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto text-sm">
                      {JSON.stringify(client.config_json || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BarChart className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Features</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {client.config_json?.features?.map((feature: string) => (
                        <Badge key={feature} variant="secondary">
                          {feature}
                        </Badge>
                      )) || (
                          <p className="text-muted-foreground">No features configured</p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                User management will be implemented in the next phase.
              </p>
              <Button className="mt-4" disabled>
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <ClientForm
            client={client}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client{' '}
              <strong>{client.name}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientDetails;