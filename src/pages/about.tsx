import { BrainCircuitIcon, Users, Zap, Shield, Globe, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <BrainCircuitIcon className="h-16 w-16 text-purple-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            About PersonaForge
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We're revolutionizing digital identity creation through cutting-edge AI technology. 
            PersonaForge empowers creators, businesses, and individuals to craft authentic digital personas 
            that engage, inspire, and connect with audiences worldwide.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Mission</h2>
            <p className="text-lg text-gray-300 text-center leading-relaxed">
              To democratize AI-powered content creation and enable everyone to build meaningful digital presences 
              that authentically represent their voice, personality, and vision.
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <Zap className="h-8 w-8 text-yellow-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">Innovation</h3>
              </div>
              <p className="text-gray-300">
                We push the boundaries of AI technology to deliver cutting-edge solutions 
                that stay ahead of the curve.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-green-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">Privacy & Security</h3>
              </div>
              <p className="text-gray-300">
                Your data and digital personas are protected with enterprise-grade security 
                and privacy measures.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-blue-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">Community</h3>
              </div>
              <p className="text-gray-300">
                We believe in building inclusive communities where creators can thrive 
                and support each other.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <Globe className="h-8 w-8 text-purple-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">Accessibility</h3>
              </div>
              <p className="text-gray-300">
                Advanced AI technology should be accessible to everyone, regardless of 
                technical expertise or background.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <Heart className="h-8 w-8 text-red-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">Authenticity</h3>
              </div>
              <p className="text-gray-300">
                We help you create digital personas that truly represent your authentic 
                voice and personality.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <BrainCircuitIcon className="h-8 w-8 text-indigo-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">Excellence</h3>
              </div>
              <p className="text-gray-300">
                We strive for excellence in every feature, interaction, and user experience 
                we deliver.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Section */}
        <div className="mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Powered by Advanced AI</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Voice Cloning & Speech</h3>
                <p className="text-gray-300 mb-4">
                  Our integration with ElevenLabs provides state-of-the-art voice cloning technology, 
                  enabling you to create natural-sounding speech that captures your unique voice characteristics.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Video Generation</h3>
                <p className="text-gray-300 mb-4">
                  Powered by Tavus, we offer advanced video generation capabilities that create 
                  realistic digital avatars and personalized video content at scale.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Built for Creators</h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <p className="text-lg text-gray-300 text-center leading-relaxed mb-6">
              PersonaForge is designed by creators, for creators. We understand the challenges of building 
              authentic digital presence in today's fast-paced digital world.
            </p>
            <p className="text-lg text-gray-300 text-center leading-relaxed">
              Whether you're a content creator, educator, business owner, or individual looking to explore 
              AI-powered personalization, PersonaForge provides the tools and platform to bring your 
              digital persona to life.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Create Your Digital Persona?</h2>
            <p className="text-lg text-gray-200 mb-6">
              Join thousands of creators who are already transforming their digital presence with PersonaForge.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/sign-up"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all duration-200 border border-white/30"
              >
                Get Started Free
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-purple-900 bg-white rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
