import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Stethoscope, 
  Briefcase, 
  Gavel,
  Heart,
  Phone,
  AlertTriangle,
  Clock,
  User,
  MessageCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface EmergencyPersona {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
  responseTime: string;
  specialties: string[];
}

const emergencyPersonas: EmergencyPersona[] = [
  {
    id: 'doctor',
    name: 'Dr. Sarah Chen',
    title: 'Emergency Medicine Physician',
    description: 'Immediate medical consultation and emergency health guidance',
    icon: <Stethoscope className="h-6 w-6" />,
    color: 'bg-red-500',
    available: true,
    responseTime: '< 2 minutes',
    specialties: ['Emergency Medicine', 'First Aid', 'Health Assessment', 'Medical Advice']
  },
  {
    id: 'lawyer',
    name: 'Attorney Michael Rodriguez',
    title: 'Emergency Legal Counsel',
    description: 'Immediate legal advice and emergency legal consultation',
    icon: <Gavel className="h-6 w-6" />,
    color: 'bg-blue-500',
    available: true,
    responseTime: '< 3 minutes',
    specialties: ['Criminal Defense', 'Emergency Legal Aid', 'Rights Protection', 'Legal Consultation']
  },
  {
    id: 'police',
    name: 'Officer Lisa Thompson',
    title: 'Emergency Response Coordinator',
    description: 'Emergency response guidance and safety coordination',
    icon: <Shield className="h-6 w-6" />,
    color: 'bg-blue-600',
    available: true,
    responseTime: '< 1 minute',
    specialties: ['Emergency Response', 'Safety Protocols', 'Crisis Management', 'Security Guidance']
  },
  {
    id: 'counselor',
    name: 'Dr. Emma Wilson',
    title: 'Crisis Counselor',
    description: 'Mental health support and crisis intervention',
    icon: <Heart className="h-6 w-6" />,
    color: 'bg-pink-500',
    available: true,
    responseTime: '< 2 minutes',
    specialties: ['Crisis Counseling', 'Mental Health', 'Emotional Support', 'Trauma Care']
  },
  {
    id: 'financial',
    name: 'Robert Kim',
    title: 'Financial Emergency Advisor',
    description: 'Emergency financial guidance and fraud protection',
    icon: <Briefcase className="h-6 w-6" />,
    color: 'bg-green-500',
    available: false,
    responseTime: '< 5 minutes',
    specialties: ['Financial Crisis', 'Fraud Protection', 'Emergency Funding', 'Investment Advice']
  },
  {
    id: 'tech',
    name: 'Alex Singh',
    title: 'Emergency Tech Support',
    description: 'Critical technology issues and cybersecurity incidents',
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'bg-purple-500',
    available: true,
    responseTime: '< 3 minutes',
    specialties: ['Cybersecurity', 'Data Recovery', 'System Failures', 'Tech Emergencies']
  }
];

export default function EmergencyPersonas() {
  const [selectedPersona, setSelectedPersona] = useState<EmergencyPersona | null>(null);
  const [consultationActive, setConsultationActive] = useState(false);

  const startEmergencyConsultation = (persona: EmergencyPersona) => {
    if (!persona.available) {
      toast({
        title: "Persona Unavailable",
        description: `${persona.name} is currently offline. Please try again later.`,
        variant: "destructive"
      });
      return;
    }

    setSelectedPersona(persona);
    setConsultationActive(true);
    
    toast({
      title: "Emergency Consultation Starting",
      description: `Connecting you with ${persona.name}...`,
    });

    // TODO: Implement ElevenLabs voice synthesis + prebuilt emergency scripts
    // TODO: Connect to Tavus for video if needed
  };

  const endConsultation = () => {
    setConsultationActive(false);
    setSelectedPersona(null);
    
    toast({
      title: "Consultation Ended",
      description: "Emergency consultation has been completed.",
    });
  };

  if (consultationActive && selectedPersona) {
    return (
      <div className="space-y-6">
        {/* Active Consultation Interface */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${selectedPersona.color} rounded-full flex items-center justify-center text-white`}>
                  {selectedPersona.icon}
                </div>
                <div>
                  <CardTitle className="text-red-800">Emergency Consultation Active</CardTitle>
                  <p className="text-sm text-red-600">Connected with {selectedPersona.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 font-medium">LIVE</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Consultation Interface */}
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedPersona.name}</p>
                  <p className="text-xs text-gray-500">{selectedPersona.title}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Online
                </div>
              </div>
              
              {/* Chat Interface Placeholder */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
                    <p className="text-sm">Hello, I'm {selectedPersona.name}. I understand this is an emergency situation. How can I help you today?</p>
                    <p className="text-xs text-gray-500 mt-1">Just now</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
              <Button variant="outline" className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                Voice Call
              </Button>
              <Button variant="destructive" onClick={endConsultation}>
                End Consultation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-red-600">Emergency Personas</h2>
          <p className="text-muted-foreground">
            Quick access to AI emergency assistance personas
          </p>
        </div>
      </div>

      {/* Emergency Banner */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                For life-threatening emergencies, call 911 immediately
              </p>
              <p className="text-xs text-red-600">
                These AI personas provide guidance but are not substitutes for professional emergency services
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Personas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {emergencyPersonas.map((persona) => (
          <Card 
            key={persona.id} 
            className={`hover:shadow-lg transition-shadow ${
              !persona.available ? 'opacity-60' : 'cursor-pointer hover:border-red-300'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 ${persona.color} rounded-lg flex items-center justify-center text-white`}>
                  {persona.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{persona.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{persona.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${persona.available ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className={`text-xs ${persona.available ? 'text-green-600' : 'text-gray-500'}`}>
                      {persona.available ? 'Available' : 'Offline'}
                    </span>
                    {persona.available && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{persona.responseTime}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{persona.description}</p>
              
              {/* Specialties */}
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Specialties:</p>
                <div className="flex flex-wrap gap-1">
                  {persona.specialties.slice(0, 3).map((specialty, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600"
                    >
                      {specialty}
                    </span>
                  ))}
                  {persona.specialties.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600">
                      +{persona.specialties.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full" 
                variant={persona.available ? "default" : "secondary"}
                disabled={!persona.available}
                onClick={() => startEmergencyConsultation(persona)}
              >
                {persona.available ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency Consult
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Currently Offline
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Emergency Personas Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-blue-500" />
              </div>
              <h4 className="font-semibold mb-2">ElevenLabs Voice</h4>
              <p className="text-sm text-gray-600">
                Each persona uses high-quality AI voice synthesis for natural conversations
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <User className="h-6 w-6 text-purple-500" />
              </div>
              <h4 className="font-semibold mb-2">Prebuilt Scripts</h4>
              <p className="text-sm text-gray-600">
                Emergency response protocols and professional guidance scripts
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <h4 className="font-semibold mb-2">24/7 Availability</h4>
              <p className="text-sm text-gray-600">
                AI personas available around the clock for emergency assistance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
