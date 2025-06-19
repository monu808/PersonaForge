import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download } from 'lucide-react';
import { AudioSegment, MergedPodcastResult } from '@/lib/api/audio-merger';

interface EnhancedPodcastPlayerProps {
  podcast: {
    id: string;
    title: string;
    description: string;
    audio_url: string | null;
    script: string;
    duration: number;
    created_at: string;
  };
  segments?: AudioSegment[];
  mergedAudio?: MergedPodcastResult;
  onClose?: () => void;
}

export default function EnhancedPodcastPlayer({ 
  podcast, 
  segments = [], 
  mergedAudio,
  onClose 
}: EnhancedPodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<'merged' | 'segments'>('merged');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Use merged audio if available, otherwise fall back to original audio_url
  const audioUrl = mergedAudio?.audioUrl || podcast.audio_url;
  const totalDuration = mergedAudio?.duration || podcast.duration;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || totalDuration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (playbackMode === 'segments' && currentSegment < segments.length - 1) {
        // Auto-advance to next segment
        setCurrentSegment(prev => prev + 1);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [totalDuration, playbackMode, currentSegment, segments.length]);

  // Update audio source when segment changes in segment mode
  useEffect(() => {
    if (playbackMode === 'segments' && segments.length > 0 && audioRef.current) {
      const currentSegmentData = segments[currentSegment];
      if (currentSegmentData?.audioUrl && currentSegmentData.audioUrl !== audioRef.current.src) {
        audioRef.current.src = currentSegmentData.audioUrl;
        audioRef.current.load();
      }
    }
  }, [currentSegment, playbackMode, segments]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playbackMode === 'segments') {
      if (currentSegment > 0) {
        setCurrentSegment(prev => prev - 1);
      }
    } else {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
    }
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playbackMode === 'segments') {
      if (currentSegment < segments.length - 1) {
        setCurrentSegment(prev => prev + 1);
      }
    } else {
      audio.currentTime = Math.min(duration, audio.currentTime + 15);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audio.currentTime = newTime;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${podcast.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCurrentSegmentInfo = () => {
    if (playbackMode === 'segments' && segments.length > 0) {
      return segments[currentSegment];
    }
    return null;
  };

  const segmentInfo = getCurrentSegmentInfo();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{podcast.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{podcast.description}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>

      {/* Playback Mode Toggle */}
      {segments.length > 0 && (
        <div className="mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setPlaybackMode('merged')}
              className={`px-3 py-1 rounded text-sm ${
                playbackMode === 'merged' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Merged Podcast
            </button>
            <button
              onClick={() => setPlaybackMode('segments')}
              className={`px-3 py-1 rounded text-sm ${
                playbackMode === 'segments' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Segment by Segment ({segments.length} parts)
            </button>
          </div>
        </div>
      )}

      {/* Current Segment Info */}
      {segmentInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm font-medium text-gray-700">
            {segmentInfo.host === 'host1' ? 'Host 1' : 'Host 2'} - Part {currentSegment + 1} of {segments.length}
          </div>
          <div className="text-sm text-gray-600 mt-1">{segmentInfo.text}</div>
        </div>
      )}

      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={audioUrl || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Progress Bar */}
      <div className="mb-4">
        <div 
          ref={progressRef}
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        <button
          onClick={skipBackward}
          className="p-2 rounded-full hover:bg-gray-100"
          title={playbackMode === 'segments' ? 'Previous segment' : 'Skip back 15s'}
        >
          <SkipBack className="w-5 h-5" />
        </button>
        
        <button
          onClick={togglePlayPause}
          className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600"
          disabled={!audioUrl}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
        
        <button
          onClick={skipForward}
          className="p-2 rounded-full hover:bg-gray-100"
          title={playbackMode === 'segments' ? 'Next segment' : 'Skip forward 15s'}
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Volume and Download */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-600" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20"
          />
        </div>
        
        {audioUrl && (
          <button
            onClick={downloadAudio}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        )}
      </div>

      {/* Merged Audio Info */}
      {mergedAudio && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Merged Podcast:</strong> {mergedAudio.metadata.totalSegments} segments, 
            {mergedAudio.metadata.hosts.length} hosts, 
            created at {new Date(mergedAudio.metadata.mergedAt).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Script Display */}
      {podcast.script && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <details className="cursor-pointer">
            <summary className="text-sm font-medium text-gray-700 mb-2">
              View Full Script
            </summary>
            <div className="text-sm text-gray-600 whitespace-pre-line max-h-40 overflow-y-auto">
              {podcast.script}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
