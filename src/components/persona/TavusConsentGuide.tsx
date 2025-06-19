import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { TAVUS_VIDEO_REQUIREMENTS } from '@/lib/tavus-guide';

interface TavusConsentGuideProps {
  className?: string;
}

export function TavusConsentGuide({ className }: TavusConsentGuideProps) {
  const copyConsentPhrase = () => {
    navigator.clipboard.writeText(TAVUS_VIDEO_REQUIREMENTS.REQUIRED_CONSENT_PHRASE);
    toast({
      title: "Copied!",
      description: "Consent phrase copied to clipboard",
    });
  };

  return (
    <div className={className}>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <Info className="h-5 w-5" />
            Tavus Consent Requirements Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required Consent Phrase */}
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-yellow-800">
                  You MUST include this exact consent phrase in your training video:
                </p>
                <div className="flex items-center gap-2 bg-white border border-yellow-300 rounded-md p-3">
                  <p className="flex-1 font-mono text-sm text-gray-800">
                    "{TAVUS_VIDEO_REQUIREMENTS.REQUIRED_CONSENT_PHRASE}"
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyConsentPhrase}
                    className="h-8 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* How to Include the Consent Phrase */}
          <div className="space-y-3">
            <h4 className="font-semibold text-blue-900">How to Include the Consent Phrase:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">✅ Good Examples</span>
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Say the phrase at the beginning of your video</li>
                  <li>• Say the phrase at the end of your video</li>
                  <li>• Speak clearly and look at the camera</li>
                  <li>• Pause briefly before/after the phrase</li>
                </ul>
              </div>
              
              <div className="bg-white border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">❌ Avoid</span>
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Changing any words in the phrase</li>
                  <li>• Speaking too quietly or unclear</li>
                  <li>• Background music covering your voice</li>
                  <li>• Saying the phrase while not visible</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sample Script */}
          <div className="bg-white border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Sample Video Script:</h4>
            <div className="bg-gray-50 border rounded-md p-3 font-mono text-sm">
              <p className="text-gray-700">
                "Hi, my name is [Your Name]. <span className="bg-yellow-200 px-1 rounded">
                {TAVUS_VIDEO_REQUIREMENTS.REQUIRED_CONSENT_PHRASE}
                </span> I'm excited to create my AI replica to help with [your use case].
              </p>
              <p className="text-gray-700 mt-2">
                [Continue with your training content - talk naturally, look at camera, good lighting...]"
              </p>
            </div>
          </div>

          {/* Consent Requirements Checklist */}
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-900">Consent Requirements Checklist:</h4>
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              {TAVUS_VIDEO_REQUIREMENTS.CONSENT_REQUIREMENTS.map((requirement, index) => (
                <div key={index} className="flex items-start gap-2 py-1">
                  <div className="w-4 h-4 border border-gray-300 rounded mt-0.5 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{requirement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Common Issues */}
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div>
                <p className="font-semibold text-red-800 mb-1">
                  Common Error: "Your consent phrase does not match our requirements"
                </p>
                <p className="text-red-700 text-sm">
                  This error occurs when the exact consent phrase is not detected in your video. 
                  Make sure you say the phrase exactly as written above, with clear pronunciation and audible speech.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Additional Tips */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Pro Tips for Success:
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Test your audio levels before recording</li>
              <li>• Record in a quiet environment</li>
              <li>• Speak slightly slower than normal</li>
              <li>• Review your video before uploading</li>
              <li>• Keep the video under 2 minutes total</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <p className="text-xs text-blue-600">
              💡 Remember: This consent phrase is required by Tavus for ethical AI replica creation. 
              It ensures you have explicitly authorized the creation of your digital likeness.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TavusConsentGuide;
