import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Upload, 
  RotateCcw, 
  Info,
  Database,
  Activity
} from 'lucide-react';
import { sidebarStateService } from '@/services/sidebarStateService';
import { useSidebarStatePersistence } from '@/hooks/useSidebarStatePersistence';

/**
 * Sidebar Diagnostics Component
 * 
 * Provides debugging and diagnostic tools for the sidebar state system.
 * Only shown in development mode or when explicitly enabled.
 */
const SidebarDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState(sidebarStateService.getDiagnostics());
  const [exportData, setExportData] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const { clearStoredState } = useSidebarStatePersistence();

  // Refresh diagnostics
  const refreshDiagnostics = () => {
    setDiagnostics(sidebarStateService.getDiagnostics());
  };

  // Export sidebar data
  const handleExport = () => {
    const data = sidebarStateService.exportData();
    if (data) {
      setExportData(data);
      
      // Create download link
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sidebar-state-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Import sidebar data
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = sidebarStateService.importData(content);
        
        if (success) {
          setImportSuccess(true);
          setImportError(null);
          refreshDiagnostics();
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('Failed to import data - invalid format or storage error');
          setImportSuccess(false);
        }
      } catch (error) {
        setImportError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setImportSuccess(false);
      }
    };
    reader.readAsText(file);
  };

  // Reset all data
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all sidebar data? This cannot be undone.')) {
      const success = sidebarStateService.resetAllData();
      if (success) {
        clearStoredState();
        refreshDiagnostics();
        window.location.reload(); // Reload to reset component state
      }
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sidebar Diagnostics</h2>
          <p className="text-muted-foreground">Debug and manage sidebar state persistence</p>
        </div>
        <Button onClick={refreshDiagnostics} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Storage Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            {diagnostics.storageAvailable ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700 dark:text-green-400">localStorage Available</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 dark:text-red-400">localStorage Unavailable</span>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Session ID:</span>
              <p className="text-muted-foreground font-mono">{diagnostics.sessionId}</p>
            </div>
            <div>
              <span className="font-medium">Sync Listeners:</span>
              <p className="text-muted-foreground">{diagnostics.syncListeners} active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current State */}
      <Card>
        <CardHeader>
          <CardTitle>Current State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Mode:</span>
              <Badge variant="secondary">{diagnostics.currentState?.mode || 'Not set'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>User Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Remember State:</span>
              <p className="text-muted-foreground">
                {diagnostics.preferences.rememberState ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <span className="font-medium">Default Mode:</span>
              <p className="text-muted-foreground">{diagnostics.preferences.defaultMode}</p>
            </div>
            <div>
              <span className="font-medium">Hover Delay:</span>
              <p className="text-muted-foreground">{diagnostics.preferences.hoverDelay}ms</p>
            </div>
            <div>
              <span className="font-medium">Transition Speed:</span>
              <p className="text-muted-foreground">{diagnostics.preferences.transitionSpeed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
          <CardDescription>Track how the sidebar is being used</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="font-medium">Total Sessions:</span>
              <p className="text-muted-foreground">{diagnostics.analytics.sessionCount}</p>
            </div>
            <div>
              <span className="font-medium">Total Interactions:</span>
              <p className="text-muted-foreground">{diagnostics.analytics.totalInteractions}</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <span className="font-medium mb-2 block">Mode Usage:</span>
            <div className="space-y-2">
              {Object.entries(diagnostics.analytics.modeUsage).map(([mode, count]) => (
                <div key={mode} className="flex justify-between items-center">
                  <span className="text-muted-foreground capitalize">{mode.replace('-', ' ')}:</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage sidebar data and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="import-file"
              />
              <Button variant="outline" asChild>
                <label htmlFor="import-file" className="cursor-pointer flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </label>
              </Button>
            </div>
            
            <Button onClick={handleReset} variant="destructive">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Data
            </Button>
          </div>
          
          {importSuccess && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Data imported successfully!</span>
              </div>
            </div>
          )}
          
          {importError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{importError}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Data Preview */}
      {exportData && (
        <Card>
          <CardHeader>
            <CardTitle>Exported Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-64">
              {exportData}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Development Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Development Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• This component is for debugging and development purposes</p>
            <p>• State persistence works across browser sessions and tabs</p>
            <p>• Data is automatically cleaned up after 30 days of inactivity</p>
            <p>• Cross-tab synchronization keeps sidebar state consistent</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SidebarDiagnostics;