import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Mail,
  Palette,
  Globe,
  Clock,
  DollarSign,
  Users,
  Phone,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface SystemSettings {
  // General Settings
  systemName: string;
  systemDescription: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  
  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  slackIntegration: boolean;
  webhookUrl: string;
  notificationEmails: string[];
  
  // Security Settings
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  twoFactorRequired: boolean;
  ipWhitelist: string[];
  
  // Call Settings
  defaultCallTimeout: number;
  maxConcurrentCalls: number;
  recordingEnabled: boolean;
  transcriptionEnabled: boolean;
  qualityThreshold: number;
  
  // Billing Settings
  defaultBillingCycle: string;
  taxRate: number;
  lateFeePercentage: number;
  gracePeriodDays: number;
  
  // Integration Settings
  openaiApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  
  // UI Settings
  brandingEnabled: boolean;
  customLogo: string;
  primaryColor: string;
  secondaryColor: string;
  darkModeEnabled: boolean;
  
  // Maintenance Settings
  maintenanceMode: boolean;
  maintenanceMessage: string;
  backupFrequency: string;
  logRetentionDays: number;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    // Default values
    systemName: 'AI Call System',
    systemDescription: 'Advanced AI-powered call management platform',
    supportEmail: 'support@example.com',
    supportPhone: '+1-555-0123',
    timezone: 'America/Toronto',
    dateFormat: 'MM/DD/YYYY',
    currency: 'CAD',
    
    emailNotifications: true,
    smsNotifications: false,
    slackIntegration: false,
    webhookUrl: '',
    notificationEmails: ['admin@example.com'],
    
    sessionTimeout: 30,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false,
    },
    twoFactorRequired: false,
    ipWhitelist: [],
    
    defaultCallTimeout: 300,
    maxConcurrentCalls: 100,
    recordingEnabled: true,
    transcriptionEnabled: true,
    qualityThreshold: 7.0,
    
    defaultBillingCycle: 'monthly',
    taxRate: 13.0,
    lateFeePercentage: 5.0,
    gracePeriodDays: 7,
    
    openaiApiKey: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    stripePublishableKey: '',
    stripeSecretKey: '',
    
    brandingEnabled: true,
    customLogo: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    darkModeEnabled: true,
    
    maintenanceMode: false,
    maintenanceMessage: 'System is currently under maintenance. Please check back later.',
    backupFrequency: 'daily',
    logRetentionDays: 90,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleNestedSettingChange = (parentKey: string, childKey: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey as keyof SystemSettings] as any,
        [childKey]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, this would save to the database
      // For now, we'll simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage for persistence in demo
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "All settings have been successfully updated.",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    setHasChanges(false);
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to last saved values.",
    });
  };

  const addNotificationEmail = () => {
    const email = prompt('Enter email address:');
    if (email && email.includes('@')) {
      setSettings(prev => ({
        ...prev,
        notificationEmails: [...prev.notificationEmails, email]
      }));
      setHasChanges(true);
    }
  };

  const removeNotificationEmail = (index: number) => {
    setSettings(prev => ({
      ...prev,
      notificationEmails: prev.notificationEmails.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  useEffect(() => {
    // Load settings from localStorage on component mount
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Unsaved Changes
            </Badge>
          )}
          <Button onClick={handleResetSettings} variant="outline" disabled={!hasChanges}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading || !hasChanges}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={settings.systemName}
                    onChange={(e) => handleSettingChange('systemName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="systemDescription">System Description</Label>
                <Textarea
                  id="systemDescription"
                  value={settings.systemDescription}
                  onChange={(e) => handleSettingChange('systemDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Toronto">Eastern Time</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                UI & Branding
              </CardTitle>
              <CardDescription>Customize the appearance of your system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="brandingEnabled">Enable Custom Branding</Label>
                  <p className="text-sm text-muted-foreground">Allow custom logos and colors</p>
                </div>
                <Switch
                  id="brandingEnabled"
                  checked={settings.brandingEnabled}
                  onCheckedChange={(checked) => handleSettingChange('brandingEnabled', checked)}
                />
              </div>

              {settings.brandingEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkModeEnabled">Enable Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Allow users to switch to dark theme</p>
                </div>
                <Switch
                  id="darkModeEnabled"
                  checked={settings.darkModeEnabled}
                  onCheckedChange={(checked) => handleSettingChange('darkModeEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Channels
              </CardTitle>
              <CardDescription>Configure how the system sends notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="slackIntegration">Slack Integration</Label>
                  <p className="text-sm text-muted-foreground">Send notifications to Slack</p>
                </div>
                <Switch
                  id="slackIntegration"
                  checked={settings.slackIntegration}
                  onCheckedChange={(checked) => handleSettingChange('slackIntegration', checked)}
                />
              </div>

              {settings.slackIntegration && (
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Slack Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    value={settings.webhookUrl}
                    onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notification Recipients
              </CardTitle>
              <CardDescription>Manage who receives system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Notification Emails</Label>
                  <Button onClick={addNotificationEmail} size="sm">
                    Add Email
                  </Button>
                </div>
                <div className="space-y-2">
                  {settings.notificationEmails.map((email, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                      <span className="text-sm">{email}</span>
                      <Button
                        onClick={() => removeNotificationEmail(index)}
                        size="sm"
                        variant="destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication & Access
              </CardTitle>
              <CardDescription>Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="480"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorRequired">Require 2FA</Label>
                    <p className="text-sm text-muted-foreground">Force all users to enable 2FA</p>
                  </div>
                  <Switch
                    id="twoFactorRequired"
                    checked={settings.twoFactorRequired}
                    onCheckedChange={(checked) => handleSettingChange('twoFactorRequired', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Password Policy</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Minimum Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      value={settings.passwordPolicy.minLength}
                      onChange={(e) => handleNestedSettingChange('passwordPolicy', 'minLength', parseInt(e.target.value))}
                      min="6"
                      max="32"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireUppercase">Require Uppercase</Label>
                      <Switch
                        id="requireUppercase"
                        checked={settings.passwordPolicy.requireUppercase}
                        onCheckedChange={(checked) => handleNestedSettingChange('passwordPolicy', 'requireUppercase', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireNumbers">Require Numbers</Label>
                      <Switch
                        id="requireNumbers"
                        checked={settings.passwordPolicy.requireNumbers}
                        onCheckedChange={(checked) => handleNestedSettingChange('passwordPolicy', 'requireNumbers', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireSymbols">Require Symbols</Label>
                      <Switch
                        id="requireSymbols"
                        checked={settings.passwordPolicy.requireSymbols}
                        onCheckedChange={(checked) => handleNestedSettingChange('passwordPolicy', 'requireSymbols', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Call Settings */}
        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Configuration
              </CardTitle>
              <CardDescription>Configure call handling and quality settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultCallTimeout">Default Call Timeout (seconds)</Label>
                  <Input
                    id="defaultCallTimeout"
                    type="number"
                    value={settings.defaultCallTimeout}
                    onChange={(e) => handleSettingChange('defaultCallTimeout', parseInt(e.target.value))}
                    min="60"
                    max="3600"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentCalls">Max Concurrent Calls</Label>
                  <Input
                    id="maxConcurrentCalls"
                    type="number"
                    value={settings.maxConcurrentCalls}
                    onChange={(e) => handleSettingChange('maxConcurrentCalls', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="recordingEnabled">Enable Call Recording</Label>
                    <p className="text-sm text-muted-foreground">Record all calls by default</p>
                  </div>
                  <Switch
                    id="recordingEnabled"
                    checked={settings.recordingEnabled}
                    onCheckedChange={(checked) => handleSettingChange('recordingEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="transcriptionEnabled">Enable Transcription</Label>
                    <p className="text-sm text-muted-foreground">Transcribe calls automatically</p>
                  </div>
                  <Switch
                    id="transcriptionEnabled"
                    checked={settings.transcriptionEnabled}
                    onCheckedChange={(checked) => handleSettingChange('transcriptionEnabled', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualityThreshold">Quality Threshold (1-10)</Label>
                <Input
                  id="qualityThreshold"
                  type="number"
                  step="0.1"
                  value={settings.qualityThreshold}
                  onChange={(e) => handleSettingChange('qualityThreshold', parseFloat(e.target.value))}
                  min="1"
                  max="10"
                />
                <p className="text-sm text-muted-foreground">
                  Calls below this threshold will be flagged for review
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Billing Configuration
              </CardTitle>
              <CardDescription>Configure billing cycles and payment settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultBillingCycle">Default Billing Cycle</Label>
                  <Select value={settings.defaultBillingCycle} onValueChange={(value) => handleSettingChange('defaultBillingCycle', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
                    min="0"
                    max="50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lateFeePercentage">Late Fee (%)</Label>
                  <Input
                    id="lateFeePercentage"
                    type="number"
                    step="0.01"
                    value={settings.lateFeePercentage}
                    onChange={(e) => handleSettingChange('lateFeePercentage', parseFloat(e.target.value))}
                    min="0"
                    max="25"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gracePeriodDays">Grace Period (days)</Label>
                  <Input
                    id="gracePeriodDays"
                    type="number"
                    value={settings.gracePeriodDays}
                    onChange={(e) => handleSettingChange('gracePeriodDays', parseInt(e.target.value))}
                    min="0"
                    max="30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Keys & Integrations
              </CardTitle>
              <CardDescription>Configure third-party service integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                  <Input
                    id="openaiApiKey"
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)}
                    placeholder="sk-..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twilioAccountSid">Twilio Account SID</Label>
                    <Input
                      id="twilioAccountSid"
                      type="password"
                      value={settings.twilioAccountSid}
                      onChange={(e) => handleSettingChange('twilioAccountSid', e.target.value)}
                      placeholder="AC..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twilioAuthToken">Twilio Auth Token</Label>
                    <Input
                      id="twilioAuthToken"
                      type="password"
                      value={settings.twilioAuthToken}
                      onChange={(e) => handleSettingChange('twilioAuthToken', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                    <Input
                      id="stripePublishableKey"
                      type="password"
                      value={settings.stripePublishableKey}
                      onChange={(e) => handleSettingChange('stripePublishableKey', e.target.value)}
                      placeholder="pk_..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                    <Input
                      id="stripeSecretKey"
                      type="password"
                      value={settings.stripeSecretKey}
                      onChange={(e) => handleSettingChange('stripeSecretKey', e.target.value)}
                      placeholder="sk_..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Maintenance & Backup
              </CardTitle>
              <CardDescription>System maintenance and backup settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Put system in maintenance mode</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
              </div>

              {settings.maintenanceMode && (
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={settings.maintenanceMessage}
                    onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select value={settings.backupFrequency} onValueChange={(value) => handleSettingChange('backupFrequency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logRetentionDays">Log Retention (days)</Label>
                  <Input
                    id="logRetentionDays"
                    type="number"
                    value={settings.logRetentionDays}
                    onChange={(e) => handleSettingChange('logRetentionDays', parseInt(e.target.value))}
                    min="7"
                    max="365"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;