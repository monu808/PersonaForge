import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Volume2, 
  Loader2,
  ChevronDown
} from 'lucide-react';
import { ElevenLabsVoice, getAvailableVoices } from '@/lib/api/elevenlabs';
import { toast } from '@/components/ui/use-toast';

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onVoiceSelect: (voiceId: string, voiceName: string) => void;
  label?: string;
  defaultVoices?: Array<{
    id: string;
    name: string;
    category?: string;
    description?: string;
    previewUrl?: string;
  }>;
}

export function VoiceSelector({ 
  selectedVoiceId, 
  onVoiceSelect, 
  label = "Select Voice",
  defaultVoices = []
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadVoices();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const loadVoices = async () => {
    try {
      setIsLoading(true);
      const elevenlabsVoices = await getAvailableVoices();
      
      // Combine default voices with ElevenLabs voices
      const allVoices = [
        ...defaultVoices.map(voice => ({
          ...voice,
          category: voice.category || 'default'
        })),
        ...elevenlabsVoices
      ];
      
      setVoices(allVoices);
    } catch (error) {
      console.error('Error loading voices:', error);
      setVoices(defaultVoices.map(voice => ({
        ...voice,
        category: voice.category || 'default'
      })));
      
      toast({
        title: "Voice Loading Issue",
        description: "Using default voices. Some features may be limited.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPreview = (voice: ElevenLabsVoice, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!voice.previewUrl) {
      toast({
        title: "Preview Not Available",
        description: `No preview available for ${voice.name}`,
      });
      return;
    }

    // Stop current audio if playing
    if (audioRef.current && playingVoiceId === voice.id) {
      audioRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Create new audio element
    audioRef.current = new Audio(voice.previewUrl);
    audioRef.current.onplay = () => setPlayingVoiceId(voice.id);
    audioRef.current.onpause = () => setPlayingVoiceId(null);
    audioRef.current.onended = () => setPlayingVoiceId(null);
    audioRef.current.onerror = () => {
      setPlayingVoiceId(null);
      toast({
        title: "Playback Error",
        description: `Could not play preview for ${voice.name}`,
        variant: "destructive",
      });
    };

    // Play the audio
    audioRef.current.play().catch(error => {
      console.error('Error playing audio:', error);
      setPlayingVoiceId(null);
    });
  };

  const selectedVoice = voices.find(v => v.id === selectedVoiceId);
  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>        <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg border border-gray-300">
          <Loader2 className="h-4 w-4 animate-spin text-purple-600 mr-2" />
          <span className="text-gray-600 text-sm">Loading voices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      
      {/* Simple Dropdown */}
      <div className="relative">        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-left text-gray-900 hover:bg-gray-50 transition-all duration-200 flex items-center justify-between"
        >
          <span className="font-medium">
            {selectedVoice ? selectedVoice.name : 'Select a voice...'}
          </span>
          <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (          <div className="absolute top-full left-0 right-0 mt-1 max-h-64 bg-white border border-gray-300 rounded-lg shadow-lg overflow-y-auto z-50">
            {voices.map((voice) => (
              <div
                key={voice.id}
                onClick={() => {
                  onVoiceSelect(voice.id, voice.name);
                  setIsOpen(false);
                }}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                  selectedVoiceId === voice.id ? 'bg-purple-50 text-purple-900' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">                    <div className="text-sm font-medium">{voice.name}</div>
                    {voice.description && (
                      <div className="text-xs text-gray-500 mt-1">{voice.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1 capitalize">
                      {voice.category} voice
                    </div>
                  </div>
                  
                  {voice.previewUrl && (                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handlePlayPreview(voice, e)}
                      className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200"
                    >
                      {playingVoiceId === voice.id ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
              {voices.length === 0 && (              <div className="p-6 text-center text-gray-500">
                <Volume2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm">No voices available</div>
              </div>
            )}
          </div>
        )}
      </div>
        {/* Selected Voice Preview (if available) */}
      {selectedVoice && selectedVoice.previewUrl && (        <div className="w-full bg-purple-100 border border-purple-300 rounded-lg">
          <Button
            variant="ghost"
            onClick={(e) => handlePlayPreview(selectedVoice, e)}
            className="w-full h-12 text-purple-700 hover:text-purple-800 hover:bg-purple-200 transition-all duration-200 justify-start px-4"
          >
            {playingVoiceId === selectedVoice.id ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Preview
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Preview Selected
              </>
            )}
            <span className="ml-2 text-sm">
              Click to preview {selectedVoice.name}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}

export default VoiceSelector;
