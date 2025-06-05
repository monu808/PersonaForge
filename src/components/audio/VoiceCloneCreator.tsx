import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Upload, X, Mic, FileAudio } from 'lucide-react';
import { createVoiceClone, VoiceCloneRequest } from '@/lib/api/elevenlabs';

interface VoiceCloneCreatorProps {
  onVoiceCreated?: (voiceId: string, voiceName: string) => void;
}

export function VoiceCloneCreator({ onVoiceCreated }: VoiceCloneCreatorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Validate file types (only audio files)
      const validFiles = newFiles.filter(file => 
        file.type.startsWith('audio/') || 
        file.name.match(/\.(mp3|wav|m4a|flac|ogg)$/i)
      );
      
      if (validFiles.length !== newFiles.length) {
        setError('Please select only audio files (MP3, WAV, M4A, FLAC, OGG)');
        return;
      }
      
      setFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a voice name');
      return;
    }
    
    if (files.length === 0) {
      setError('Please select at least one audio file');
      return;
    }
    
    if (files.length < 3) {
      setError('For best results, please provide at least 3 audio samples');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const request: VoiceCloneRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        files,
      };

      const response = await createVoiceClone(request);

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess(`Voice "${response.name}" created successfully!`);
      setName('');
      setDescription('');
      setFiles([]);
      
      if (onVoiceCreated) {
        onVoiceCreated(response.voice_id, response.name);
      }
    } catch (err) {
      console.error('Error creating voice clone:', err);
      setError(err instanceof Error ? err.message : 'Failed to create voice clone');
    } finally {
      setIsCreating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Clone Your Voice
        </CardTitle>
        <CardDescription>
          Create a custom voice clone by uploading 3-5 high-quality audio samples (at least 1 minute each)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Voice Name */}
          <div className="space-y-2">
            <label htmlFor="voiceName" className="text-sm font-medium">
              Voice Name *
            </label>
            <Input
              id="voiceName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your cloned voice"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="voiceDescription" className="text-sm font-medium">
              Description (Optional)
            </label>
            <Textarea
              id="voiceDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the voice characteristics, use case, etc."
              rows={3}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Audio Samples * (3-5 files recommended)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCreating}
              >
                <Upload className="mr-2 h-4 w-4" />
                Add Files
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileAudio className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isCreating}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Guidelines */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Upload 3-5 clear audio samples (at least 1 minute each)</p>
              <p>• Use high-quality recordings with minimal background noise</p>
              <p>• Speak naturally and at a consistent pace</p>
              <p>• Supported formats: MP3, WAV, M4A, FLAC, OGG</p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isCreating || !name.trim() || files.length === 0}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Voice Clone...
              </>
            ) : (
              'Create Voice Clone'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
