import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Play, Settings } from 'lucide-react';
import { PODCAST_TOPICS, DEFAULT_PODCAST_VOICES } from '@/lib/api/podcasts';
import { getPodcastManager, type PodcastGenerationOptions } from '@/lib/api/podcast-manager';
import { VoiceSelectorCard } from './VoiceSelector';
import { toast } from '@/components/ui/use-toast';

interface PodcastCreatorProps {
  onPodcastCreated?: () => void;
}

export function PodcastCreator({ onPodcastCreated }: PodcastCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [duration, setDuration] = useState<number>(7);
  const [host1Voice, setHost1Voice] = useState(DEFAULT_PODCAST_VOICES.host1.id);
  const [host2Voice, setHost2Voice] = useState(DEFAULT_PODCAST_VOICES.host2.id);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableMerging, setEnableMerging] = useState(true);
  const [quality, setQuality] = useState<'draft' | 'standard' | 'high'>('standard');
  const podcastManager = getPodcastManager();

  const handleCreatePodcast = async () => {
    setIsCreating(true);

    try {
      const topic = customTopic.trim() || selectedTopic;
      
      if (!topic) {
        toast({
          title: "Topic Required",
          description: "Please select a topic or enter a custom topic.",
          variant: "destructive",
        });
        return;
      }      // Create enhanced podcast with audio merging capabilities
      const options: PodcastGenerationOptions = {
        enableMerging,
        quality,
        pauseBetweenSpeakers: 1.0,
        maxSegments: duration > 7 ? 12 : 8
      };

      const result = await podcastManager.createEnhancedPodcast({
        title: topic,
        description: `A podcast about ${topic}`,
        topic,
        duration,
        host1VoiceId: host1Voice,
        host2VoiceId: host2Voice,
      }, options);

      if (result.error) throw new Error(result.error);

      toast({
        title: "Podcast Created!",
        description: enableMerging && podcastManager.isMergingSupported() 
          ? `Enhanced podcast about "${topic}" is being generated with audio merging.`
          : `Your podcast about "${topic}" is being generated. Audio will be ready shortly.`,
      });

      // Reset form
      setCustomTopic('');
      setSelectedTopic('');
      setDuration(7);
      
      // Notify parent component
      onPodcastCreated?.();

    } catch (error) {
      console.error('Error creating podcast:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create podcast",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Create AI Podcast
        </CardTitle>
        <CardDescription className="text-white/60">
          Generate a conversation between two AI hosts on any topic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Topic Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic" className="text-white/80">Choose a Topic</Label>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select a topic or use custom below..." />
              </SelectTrigger>
              <SelectContent>
                {PODCAST_TOPICS.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="customTopic" className="text-white/80">Or Enter Custom Topic</Label>
            <Input
              id="customTopic"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g., The Future of Space Exploration"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <Label htmlFor="duration" className="text-white/80">Duration (minutes)</Label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              id="duration"
              min="5"
              max="15"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-white/80 min-w-[3rem]">{duration} min</span>
          </div>
        </div>

        {/* Advanced Settings */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="bg-transparent border-white/20 text-white/80 hover:bg-white/5"
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced Settings
          </Button>          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <VoiceSelectorCard
                title="Voice Selection"
                description="Choose the voices for your podcast hosts"
                host1Voice={host1Voice}
                host2Voice={host2Voice}
                onHost1Change={setHost1Voice}
                onHost2Change={setHost2Voice}
                className="bg-white/5 border-white/10"
              />

              <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
                <div>
                  <Label className="text-white/80">Audio Quality</Label>
                  <Select value={quality} onValueChange={(value) => setQuality(value as 'draft' | 'standard' | 'high')}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (Fast)</SelectItem>
                      <SelectItem value="standard">Standard (Recommended)</SelectItem>
                      <SelectItem value="high">High Quality (Slower)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableMerging"
                    checked={enableMerging}
                    onChange={(e) => setEnableMerging(e.target.checked)}
                    className="rounded border-white/20"
                  />
                  <Label htmlFor="enableMerging" className="text-white/80">
                    Enable Audio Merging (Creates complete conversational podcast)
                  </Label>
                </div>

                {enableMerging && !podcastManager.isMergingSupported() && (
                  <div className="text-amber-400 text-xs mt-2 p-2 bg-amber-400/10 rounded">
                    ⚠️ Audio merging not supported in this browser. Will use standard generation.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreatePodcast}
          disabled={isCreating || (!customTopic.trim() && !selectedTopic)}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Podcast...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Create Podcast
            </>
          )}
        </Button>

          {isCreating && (
            <div className="text-center text-white/60 text-sm">
              <p>Generating script and audio... This may take a few minutes.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
}
