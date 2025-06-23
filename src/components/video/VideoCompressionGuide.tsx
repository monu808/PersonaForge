import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Video, Scissors, Settings, Download } from 'lucide-react';
import { TAVUS_VIDEO_REQUIREMENTS } from '@/lib/tavus-guide';

interface VideoCompressionGuideProps {
  currentFileSizeMB?: number;
  onClose?: () => void;
}

export function VideoCompressionGuide({ currentFileSizeMB, onClose }: VideoCompressionGuideProps) {
  const targetSizeMB = TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB;
  const reductionNeeded = currentFileSizeMB ? Math.ceil(currentFileSizeMB - targetSizeMB) : 0;

  const compressionTools = [
    {
      name: 'HandBrake',
      type: 'Desktop App',
      url: 'https://handbrake.fr/',
      description: 'Free, powerful video compression software',
      pros: ['Professional quality', 'Advanced settings', 'Batch processing'],
      icon: Download
    },
    {
      name: 'CloudConvert',
      type: 'Online',
      url: 'https://cloudconvert.com/mp4-compress',
      description: 'Online video compressor with quality presets',
      pros: ['No software needed', 'Quality presets', 'Privacy focused'],
      icon: ExternalLink
    },
    {
      name: 'FreeConvert',
      type: 'Online',
      url: 'https://www.freeconvert.com/video-compressor',
      description: 'Free online video compression',
      pros: ['Simple interface', 'Multiple formats', 'Fast processing'],
      icon: ExternalLink
    },
    {
      name: 'Clipchamp',
      type: 'Online/App',
      url: 'https://clipchamp.com/',
      description: 'Video editor with compression features',
      pros: ['Built-in editor', 'Easy presets', 'Microsoft owned'],
      icon: ExternalLink
    }
  ];

  const quickTips = [
    {
      icon: Video,
      title: 'Reduce Resolution',
      description: `Lower resolution from 1080p to 720p (saves ~40% file size)`,
      technical: 'Change resolution in video settings before export'
    },
    {
      icon: Settings,
      title: 'Adjust Bitrate',
      description: 'Lower video bitrate to reduce quality slightly but save space',
      technical: 'Try 2-4 Mbps for 720p, 4-6 Mbps for 1080p'
    },
    {
      icon: Scissors,
      title: 'Trim Duration',
      description: `Keep video to ${TAVUS_VIDEO_REQUIREMENTS.RECOMMENDED_DURATION_SECONDS}s (recommended length)`,
      technical: 'Focus on clear face shots with the consent phrase'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Compression Guide
            {currentFileSizeMB && (
              <span className="text-sm font-normal text-gray-600">
                (Current: {currentFileSizeMB.toFixed(1)}MB → Target: Under {targetSizeMB}MB)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {reductionNeeded > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-900 mb-2">
                📊 File Size Analysis
              </h3>
              <p className="text-sm text-orange-800">
                Your video needs to be reduced by approximately <strong>{reductionNeeded}MB</strong> to meet the {targetSizeMB}MB limit.
                This typically requires reducing quality by 20-40% or trimming duration.
              </p>
            </div>
          )}

          {/* Quick Tips */}
          <div>
            <h3 className="font-semibold mb-3">🚀 Quick Compression Tips</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {quickTips.map((tip, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <tip.icon className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">{tip.title}</h4>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">{tip.description}</p>
                  <p className="text-xs text-blue-600 font-mono">{tip.technical}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Compression Tools */}
          <div>
            <h3 className="font-semibold mb-3">🛠️ Recommended Compression Tools</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {compressionTools.map((tool, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{tool.name}</h4>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {tool.type}
                      </span>
                    </div>
                    <tool.icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
                  <div className="mb-3">
                    <ul className="text-xs text-gray-500 space-y-1">
                      {tool.pros.map((pro, i) => (
                        <li key={i}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(tool.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Use {tool.name}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Settings */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">⚙️ Optimal Settings for Training Videos</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Video Settings:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Resolution:</strong> 720p (1280x720) or 1080p</li>
                  <li>• <strong>Frame Rate:</strong> 24-30 fps</li>
                  <li>• <strong>Bitrate:</strong> 2-4 Mbps (720p), 4-6 Mbps (1080p)</li>
                  <li>• <strong>Codec:</strong> H.264 (most compatible)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Audio Settings:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Codec:</strong> AAC</li>
                  <li>• <strong>Bitrate:</strong> 128 kbps</li>
                  <li>• <strong>Sample Rate:</strong> 44.1 kHz</li>
                  <li>• <strong>Channels:</strong> Stereo or Mono</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onClose} className="flex-1">
              Got it, I'll compress my video
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://handbrake.fr/', '_blank')}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download HandBrake (Recommended)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VideoCompressionGuide;
