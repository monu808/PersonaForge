export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Documentation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <ul className="space-y-2 text-gray-700">
              <li><a href="#quickstart" className="text-primary-600 hover:underline">Quick Start Guide</a></li>
              <li><a href="#account-setup" className="text-primary-600 hover:underline">Account Setup</a></li>
              <li><a href="#first-persona" className="text-primary-600 hover:underline">Creating Your First Persona</a></li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Persona Management</h2>
            <ul className="space-y-2 text-gray-700">
              <li><a href="#persona-creation" className="text-primary-600 hover:underline">Creating Personas</a></li>
              <li><a href="#persona-training" className="text-primary-600 hover:underline">Training Your Persona</a></li>
              <li><a href="#persona-deployment" className="text-primary-600 hover:underline">Deploying Personas</a></li>
            </ul>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Video & Audio</h2>
            <ul className="space-y-2 text-gray-700">
              <li><a href="#video-generation" className="text-primary-600 hover:underline">Video Generation with Tavus</a></li>
              <li><a href="#voice-synthesis" className="text-primary-600 hover:underline">Voice Synthesis with ElevenLabs</a></li>
              <li><a href="#replica-creation" className="text-primary-600 hover:underline">Creating Digital Replicas</a></li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">API Reference</h2>
            <ul className="space-y-2 text-gray-700">
              <li><a href="#api-auth" className="text-primary-600 hover:underline">Authentication</a></li>
              <li><a href="#api-endpoints" className="text-primary-600 hover:underline">API Endpoints</a></li>
              <li><a href="#api-examples" className="text-primary-600 hover:underline">Code Examples</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="prose max-w-none">
        <section id="quickstart" className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Quick Start Guide</h2>
          <p className="text-gray-700 mb-4">
            Welcome to PersonaForge! This guide will help you get started with creating and managing AI personas.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Sign up for a PersonaForge account</li>
            <li>Complete your profile setup</li>
            <li>Create your first persona</li>
            <li>Upload training data (images, videos, or audio)</li>
            <li>Generate your first AI content</li>
          </ol>
        </section>
        
        <section id="persona-creation" className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Creating Personas</h2>
          <p className="text-gray-700 mb-4">
            Personas are the foundation of PersonaForge. They represent the AI characters you'll use for content generation.
          </p>
          <h3 className="text-xl font-semibold mb-2">Steps to Create a Persona:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Navigate to the "Create" page</li>
            <li>Fill in the persona details (name, description, personality traits)</li>
            <li>Upload reference materials (photos, videos, or voice samples)</li>
            <li>Configure voice and appearance settings</li>
            <li>Save and begin training</li>
          </ol>
        </section>
        
        <section id="video-generation" className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Video Generation with Tavus</h2>
          <p className="text-gray-700 mb-4">
            Create realistic video content using your trained personas with Tavus integration.
          </p>
          <h3 className="text-xl font-semibold mb-2">Video Generation Process:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Select a trained persona</li>
            <li>Provide a script or audio file</li>
            <li>Choose video settings (quality, duration, style)</li>
            <li>Generate and download your video</li>
          </ol>
        </section>
        
        <section id="voice-synthesis" className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Voice Synthesis with ElevenLabs</h2>
          <p className="text-gray-700 mb-4">
            Generate high-quality voice content using ElevenLabs' advanced text-to-speech technology.
          </p>
          <h3 className="text-xl font-semibold mb-2">Voice Features:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Text-to-speech conversion</li>
            <li>Voice cloning from audio samples</li>
            <li>Multiple language support</li>
            <li>Customizable voice settings</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
