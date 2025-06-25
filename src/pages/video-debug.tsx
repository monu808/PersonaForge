import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkTavusVideoStatus } from '@/lib/api/tavus';

export default function VideoDebugPage() {
  const [videoId, setVideoId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!videoId.trim()) return;
    
    setLoading(true);
    try {
      const response = await checkTavusVideoStatus(videoId.trim());
      setResult(response);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Video Status Debug Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tavus Video ID
              </label>
              <Input
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="Enter Tavus video ID (e.g., 7ddbac72bc)"
              />
            </div>
            
            <Button onClick={handleTest} disabled={loading || !videoId.trim()}>
              {loading ? 'Checking...' : 'Check Video Status'}
            </Button>
            
            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">API Response:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
