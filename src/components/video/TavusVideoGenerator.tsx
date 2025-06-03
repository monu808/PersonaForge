import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateTavusVideo } from '@/lib/api/tavus';

interface TavusVideoGeneratorProps {
  personaId: string;
  onSuccess?: (videoId: string) => void;
  onError?: (error: Error) => void;
}

export function TavusVideoGenerator({ personaId, onSuccess, onError }: TavusVideoGeneratorProps) {
  const [script, setScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateVideo = async () => {
    if (!script.trim()) {
      setError('Please enter a script');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await generateTavusVideo({
        personaId,
        script: script.trim(),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setScript('');
      onSuccess?.(response.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate video';
      setError(errorMessage);
      onError?.(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="script" className="block text-sm font-medium text-gray-700">
          Video Script
        </label>
        <textarea
          id="script"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={4}
          placeholder="Enter your video script here..."
        />
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        onClick={handleGenerateVideo}
        disabled={isLoading || !script.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Video...
          </>
        ) : (
          'Generate Video'
        )}
      </Button>
    </div>
  );
}