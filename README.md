[![Netlify Status](https://api.netlify.com/api/v1/badges/6022dada-0156-429d-949a-f3403d31861b/deploy-status)](https://app.netlify.com/projects/classy-blini-7fca23/deploys)
# PersonaForge - AI Persona Platform

## Project Overview

PersonaForge is a comprehensive AI-powered platform that enables users to create, manage, and interact with AI personas through multiple interfaces including video generation, voice synthesis, and real-time conversations.

## Architecture

### Frontend (React + TypeScript + Vite)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom component library
- **State Management**: React Context API with custom hooks
- **Routing**: React Router v6 with protected routes
- **UI Components**: Radix UI primitives with custom styling
- **Animation**: Framer Motion for smooth transitions

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js framework
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth with JWT tokens
- **Storage**: Supabase Storage for file management
- **API Integration**: RESTful APIs for third-party services

### Third-Party Integrations
- **Tavus**: AI video generation and digital replica creation
- **ElevenLabs**: Voice synthesis and cloning
- **Stripe**: Payment processing and subscription management
- **RevenueCat**: Cross-platform subscription analytics
- **Google Gemini**: Advanced AI chat capabilities

## Key Features

### 🎭 Persona Management
- Create and customize AI personas with unique traits
- Visual persona builder with drag-and-drop interface
- Personality trait system with behavior customization
- Voice and appearance configuration

### 🎬 Video Generation (Tavus Integration)
- AI-powered video creation with digital replicas
- Training video recording with consent management
- Real-time video status tracking and notifications
- Automated video processing pipelines

### 🎵 Voice Synthesis (ElevenLabs Integration)
- Text-to-speech conversion with custom voices
- Voice cloning from audio samples
- Speech-to-speech voice conversion
- Singing voice generation capabilities

### 💬 AI Conversations
- Real-time chat with AI personas
- Google Gemini integration for advanced conversations
- Context-aware responses based on persona traits
- Multi-modal conversation support

### 💳 Subscription Management
- Stripe payment processing
- Tiered subscription plans (Free, Pro, Enterprise)
- Usage-based billing and limits
- RevenueCat analytics integration

### 🔄 Real-time Synchronization
- Cross-platform data sync between Coruscant and Neurovia
- Live activity tracking
- Real-time status updates
- Event-driven architecture

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase CLI
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/personaforge.git
cd personaforge

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Fill in your API keys and configuration

# Run database migrations
npm run supabase:migrate

# Start development servers
npm run dev          # Frontend (Vite)
npm run server:dev   # Backend (Express)
```

### Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# AI Services
TAVUS_API_KEY=your-tavus-api-key
VITE_ELEVENLABS_API_KEY=your-elevenlabs-api-key
VITE_GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

## Testing

Access the integration test dashboard at `/integration/test` to verify all systems are working correctly.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## License

This project is proprietary and confidential. All rights reserved.
