import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Users, BookOpen, Video, Headphones } from 'lucide-react';

export default function TutorialsPage() {
  const tutorials = [
    {
      id: 1,
      title: "Getting Started with PersonaForge",
      description: "Learn the basics of creating your first AI persona and getting started with the platform.",
      duration: "10:45",
      difficulty: "Beginner",
      category: "Getting Started",
      videoUrl: "", // Will be updated with actual URL
      thumbnail: "/api/placeholder/400/225",
      tags: ["basics", "setup", "first-steps"]
    },
    {
      id: 2,
      title: "Creating Digital Replicas with Tavus",
      description: "Step-by-step guide to creating realistic digital replicas using Tavus AI technology.",
      duration: "15:30",
      difficulty: "Intermediate",
      category: "Video Generation",
      videoUrl: "", // Will be updated with actual URL
      thumbnail: "/api/placeholder/400/225",
      tags: ["tavus", "replica", "video"]
    },
    {
      id: 3,
      title: "Voice Synthesis with ElevenLabs",
      description: "Master voice cloning and text-to-speech features using ElevenLabs integration.",
      duration: "12:20",
      difficulty: "Intermediate",
      category: "Audio",
      videoUrl: "", // Will be updated with actual URL
      thumbnail: "/api/placeholder/400/225",
      tags: ["elevenlabs", "voice", "audio"]
    },
    {
      id: 4,
      title: "Advanced Persona Customization",
      description: "Deep dive into persona personality settings, behavior customization, and fine-tuning.",
      duration: "18:15",
      difficulty: "Advanced",
      category: "Persona Management",
      videoUrl: "", // Will be updated with actual URL
      thumbnail: "/api/placeholder/400/225",
      tags: ["advanced", "customization", "personas"]
    }
  ];

  const categories = [
    { name: "Getting Started", icon: BookOpen, count: 3 },
    { name: "Video Generation", icon: Video, count: 5 },
    { name: "Audio", icon: Headphones, count: 4 },
    { name: "Persona Management", icon: Users, count: 6 }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Video Tutorials</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Learn how to use PersonaForge with our comprehensive video tutorials and step-by-step guides.
        </p>
      </div>

      {/* Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {categories.map((category, index) => {
          const IconComponent = category.icon;
          return (
            <Card key={index} className="text-center hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-2">
                  <IconComponent className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <CardDescription>{category.count} tutorials</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Featured Tutorial - Will be updated with actual video */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Featured Tutorial</h2>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative bg-gray-100 aspect-video lg:aspect-auto">
              {/* Placeholder for video embed - will be replaced with actual video */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <p className="text-lg font-medium">Video Tutorial Coming Soon</p>
                  <p className="text-sm opacity-80">Embedded video will appear here</p>
                </div>
              </div>
            </div>
            <div className="p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getDifficultyColor("Beginner")}>Beginner</Badge>
                <Badge variant="outline">Getting Started</Badge>
              </div>
              <h3 className="text-2xl font-bold mb-3">PersonaForge Complete Walkthrough</h3>
              <p className="text-gray-600 mb-4">
                A comprehensive introduction to PersonaForge covering everything from account setup 
                to creating your first AI persona and generating content.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>25:30</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>1.2k views</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tutorial Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">All Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial) => (
            <Card key={tutorial.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <Play className="h-12 w-12 text-gray-500" />
                </div>
                <div className="absolute top-2 left-2">
                  <Badge className={getDifficultyColor(tutorial.difficulty)}>
                    {tutorial.difficulty}
                  </Badge>
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {tutorial.duration}
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {tutorial.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{tutorial.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {tutorial.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {tutorial.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-primary-50 to-purple-50">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Need More Help?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Check out our documentation or contact our support team 
            for personalized assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/docs" 
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Documentation
            </a>
            <a 
              href="/support" 
              className="inline-flex items-center justify-center px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
