import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Music, 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Mic,
  Video,
  Volume2,
  Settings,
  AudioWaveform,
  Clock
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Replica {
  id: string;
  name: string;
  status: string;
  type: string;
}

interface PersonaSingerProps {
  replicas: Replica[];
}

interface Song {
  id: string;
  title: string;
  lyrics: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: string;
  created_at: string;
  replica_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

const musicGenres = [
  'Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Electronic', 'Jazz', 'Classical', 
  'Folk', 'Reggae', 'Blues', 'Alternative', 'Indie', 'Punk', 'Metal'
];

const voiceStyles = [
  'Natural', 'Emotional', 'Energetic', 'Calm', 'Dramatic', 'Whispery', 'Powerful', 'Smooth'
];

export default function PersonaSinger({ replicas }: PersonaSingerProps) {
  const [selectedReplica, setSelectedReplica] = useState<string>('');
  const [lyrics, setLyrics] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [activePlayer, setActivePlayer] = useState<string | null>(null);

  const generateSong = async () => {
    if (!selectedReplica || !lyrics.trim() || !songTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a replica, enter a title, and provide lyrics.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // TODO: Integrate with ElevenLabs API for voice synthesis
      // TODO: Optionally sync with Tavus for video generation
      
      const newSong: Song = {
        id: Date.now().toString(),
        title: songTitle,
        lyrics: lyrics,
        replica_id: selectedReplica,
        status: 'processing',
        created_at: new Date().toISOString()
      };

      setSongs(prev => [newSong, ...prev]);
      
      toast({
        title: "Song Generation Started",
        description: `Creating "${songTitle}" with your selected persona's voice...`,
      });

      // Simulate processing time
      setTimeout(() => {
        setSongs(prev => prev.map(song => 
          song.id === newSong.id 
            ? { 
                ...song, 
                status: 'completed', 
                audioUrl: '/mock-audio.mp3',
                duration: '3:24'
              }
            : song
        ));
        
        toast({
          title: "Song Generated!",
          description: `"${songTitle}" is ready to play.`,
        });
      }, 5000);

      // Reset form
      setLyrics('');
      setSongTitle('');
      setSelectedGenre('');
      setSelectedStyle('');
      
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate song. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const playPause = (songId: string) => {
    if (activePlayer === songId) {
      setActivePlayer(null);
    } else {
      setActivePlayer(songId);
    }
  };

  const downloadSong = (song: Song) => {
    toast({
      title: "Download Started",
      description: `Downloading "${song.title}"...`,
    });
    // TODO: Implement actual download
  };

  const generateVideo = (song: Song) => {
    toast({
      title: "Video Generation Started",
      description: `Creating video for "${song.title}" using Tavus...`,
    });
    // TODO: Integrate with Tavus for video generation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Music className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Make Your Replica Sing
          </h2>
          <p className="text-muted-foreground">
            Transform lyrics into beautiful songs using your persona's voice
          </p>
        </div>
      </div>

      {/* Song Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Create New Song
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use ElevenLabs voice synthesis to make your replica sing any lyrics
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Replica Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Persona</label>
              <Select value={selectedReplica} onValueChange={setSelectedReplica}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a persona to sing" />
                </SelectTrigger>
                <SelectContent>
                  {replicas.filter(r => r.status === 'active').map((replica) => (
                    <SelectItem key={replica.id} value={replica.id}>
                      {replica.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Song Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Song Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter song title"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
              />
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Genre (Optional)</label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Select music genre" />
                </SelectTrigger>
                <SelectContent>
                  {musicGenres.map((genre) => (
                    <SelectItem key={genre} value={genre.toLowerCase()}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice Style (Optional)</label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice style" />
                </SelectTrigger>
                <SelectContent>
                  {voiceStyles.map((style) => (
                    <SelectItem key={style} value={style.toLowerCase()}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lyrics Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Lyrics</label>
            <Textarea
              placeholder="Enter your song lyrics here...

Example:
🎵 Verse 1:
Walking down the street today
Everything seems bright and new
🎵 Chorus:
This is my moment to shine
Everything's gonna be fine..."
              className="min-h-32"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              💡 Tip: Use clear pronunciation and consider adding musical cues like 🎵
            </p>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateSong} 
            disabled={isGenerating || !selectedReplica || !lyrics.trim() || !songTitle.trim()}
            className="w-full"
          >            {isGenerating ? (
              <>
                <AudioWaveform className="h-4 w-4 mr-2 animate-pulse" />
                Generating Song...
              </>
            ) : (
              <>
                <Music className="h-4 w-4 mr-2" />
                Generate Song
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Songs */}
      {songs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Your Songs
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Songs generated using your personas' voices
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {songs.map((song) => {
                const replica = replicas.find(r => r.id === song.replica_id);
                return (
                  <div key={song.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {/* Song Info */}
                    <div className="flex-1">
                      <h4 className="font-medium">{song.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        By {replica?.name} • {song.duration || 'Processing...'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          song.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : song.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : song.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {song.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(song.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      {song.status === 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => playPause(song.id)}
                          >
                            {activePlayer === song.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadSong(song)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateVideo(song)}
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {song.status === 'processing' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 animate-spin" />
                          Processing...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Persona Singing Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Mic className="h-6 w-6 text-purple-500" />
              </div>
              <h4 className="font-semibold mb-2">ElevenLabs Voice</h4>
              <p className="text-sm text-gray-600">
                Your persona's voice is cloned and used to sing any lyrics you provide
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Music className="h-6 w-6 text-blue-500" />
              </div>
              <h4 className="font-semibold mb-2">AI Music Generation</h4>
              <p className="text-sm text-gray-600">
                Advanced AI converts text to natural singing with rhythm and melody
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Video className="h-6 w-6 text-green-500" />
              </div>
              <h4 className="font-semibold mb-2">Optional Video</h4>
              <p className="text-sm text-gray-600">
                Sync with Tavus to create videos of your persona singing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
