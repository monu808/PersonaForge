import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Film, FileAudio, Check, AlertCircle } from 'lucide-react';
import { generateTavusVideo } from '@/lib/api/tavus';
import { useAuth } from '@/lib/context/auth-context';

interface TavusVideoGeneratorProps {
  personaId: string;
  onVideoGenerated?: (videoId: string) => void;
}

export function TavusVideoGenerator({ personaId, onVideoGenerated }: TavusVideoGeneratorProps) {
  const { user } = useAuth();
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGenerateVideo = async () => {
    if (!script.trim()) {
      setError('Please enter a script for your video');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await generateTavusVideo({
        script,
        personaId,
        metadata: {
          created_by: user?.id,
          persona_id: personaId,
        }
      });

      if (error) throw error;

      setSuccess('Video generation has been started. It may take a few minutes to process.');
      setScript('');
      
      if (onVideoGenerated && data?.id) {
        onVideoGenerated(data.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          Generate Personalized Video
        </CardTitle>
        <CardDescription>
          Create a personalized AI video with your persona speaking the script you provide.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Textarea
              placeholder="Enter the script for your personalized video..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={5}
              className="resize-none w-full"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {script.length} characters. For best results, keep your script natural and conversational.
            </p>
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 text-green-700 rounded-md p-3 text-sm flex items-center">
              <Check className="h-4 w-4 mr-2 flex-shrink-0" />
              {success}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" disabled={isGenerating}>
          <FileAudio className="h-4 w-4 mr-2" />
          Upload Audio
        </Button>
        <Button onClick={handleGenerateVideo} disabled={isGenerating || !script.trim()}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Film className="h-4 w-4 mr-2" />
              Generate Video
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}