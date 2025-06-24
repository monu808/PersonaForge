import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Database, Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cleanupCorruptedPodcasts, resetAllPodcasts, getDatabaseHealth } from '@/lib/api/database-cleanup';

function DatabaseCleanup() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [health, setHealth] = useState<{
    totalPodcasts: number;
    accessiblePodcasts: number;
    corruptedPodcasts: number;
    lastError?: string;
  } | null>(null);

  const checkHealth = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const healthData = await getDatabaseHealth();
      setHealth(healthData);
      setResult(`Database Health Check Complete:
- Total Podcasts: ${healthData.totalPodcasts}
- Accessible Podcasts: ${healthData.accessiblePodcasts}
- Corrupted Podcasts: ${healthData.corruptedPodcasts}
${healthData.lastError ? `- Last Error: ${healthData.lastError}` : ''}`);
    } catch (error) {
      setResult(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupCorrupted = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const cleanupResult = await cleanupCorruptedPodcasts();
      
      if (cleanupResult.success) {
        setResult(`✅ ${cleanupResult.message}`);
        toast({
          title: "Cleanup Successful",
          description: cleanupResult.message,
        });
        // Refresh health after cleanup
        setTimeout(checkHealth, 1000);
      } else {
        setResult(`❌ ${cleanupResult.message}`);
        toast({
          title: "Cleanup Failed",
          description: cleanupResult.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Cleanup failed: ${errorMessage}`);
      toast({
        title: "Cleanup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = async () => {
    if (!confirm('⚠️ This will DELETE ALL your podcasts. Are you sure?')) {
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const resetResult = await resetAllPodcasts();
      
      if (resetResult.success) {
        setResult(`✅ ${resetResult.message}`);
        setHealth(null);
        toast({
          title: "Reset Complete",
          description: resetResult.message,
        });
      } else {
        setResult(`❌ ${resetResult.message}`);
        toast({
          title: "Reset Failed",
          description: resetResult.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Reset failed: ${errorMessage}`);
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Cleanup Tools
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Fix database timeout and JSON parsing errors by cleaning corrupted podcast data.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm font-medium">Database Issues Detected</p>
            <p className="text-xs text-muted-foreground">
              If you're seeing timeout errors or "Unterminated string in JSON" errors, this tool can help.
            </p>
          </div>
        </div>

        {health && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Database Status:
            </div>
            <div className="text-sm mt-1">
              • Total Podcasts: {health.totalPodcasts}<br/>
              • Accessible: {health.accessiblePodcasts}<br/>
              • Corrupted: {health.corruptedPodcasts}<br/>
              {health.lastError && (
                <span className="text-red-600">• Error: {health.lastError}</span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={checkHealth}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Check Health
          </Button>

          <Button
            onClick={cleanupCorrupted}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Clean Corrupted
          </Button>

          <Button
            onClick={resetAll}
            disabled={isLoading}
            variant="destructive"
            className="flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Reset All
          </Button>
        </div>

        {result && (
          <div className="p-3 bg-muted rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Check Health:</strong> Analyze your database for timeout and corruption issues</p>
          <p><strong>Clean Corrupted:</strong> Remove podcasts causing JSON parsing errors and timeouts</p>
          <p><strong>Reset All:</strong> Delete all podcasts (use if database is severely corrupted)</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default DatabaseCleanup;
