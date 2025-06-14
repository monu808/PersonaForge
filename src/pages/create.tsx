import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuitIcon,
  CheckCircle2,
  Circle,
  Info,
  Loader2,
  MessageSquare,
  Mic,
  Plus,
  Sparkles,
  UserIcon,
  Video,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FeatureGate from '@/components/subscription/feature-gate';
import { createPersona } from '@/lib/api/personas';
import { toast } from '@/components/ui/use-toast';
import {
  BEHAVIOR_TRAITS,
  KNOWLEDGE_TRAITS,
  PERSONALITY_TRAITS,
  PERSONA_TEMPLATES,
  VOICE_TRAITS,
} from '@/lib/constants';
import { PersonaTrait } from '@/lib/types';

export default function CreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTraits, setSelectedTraits] = useState<PersonaTrait[]>([]);
  const [personaName, setPersonaName] = useState('');
  const [personaDescription, setPersonaDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = PERSONA_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTraits(template.traits);
      setPersonaName(template.name);
      setPersonaDescription(template.description);
    }
  };

  const handleTraitSelection = (trait: PersonaTrait) => {
    if (selectedTraits.some((t) => t.id === trait.id)) {
      setSelectedTraits(selectedTraits.filter((t) => t.id !== trait.id));
    } else {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };

  const handleCreatePersona = async () => {
    try {
      setIsCreating(true);
      
      const replicaType = selectedTemplate && selectedTemplate !== 'scratch'
        ? PERSONA_TEMPLATES.find(t => t.id === selectedTemplate)?.type || 'professional'
        : 'professional';

      const { data, error } = await createPersona({
        name: personaName,
        description: personaDescription,
        traits: selectedTraits,
        replicaType: replicaType,
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Your persona has been created successfully.',
      });

      // Navigate to the persona management page with the new persona ID
      navigate(`/personas/${data.id}/manage`);
    } catch (err) {
      console.error('Error creating persona:', err);
      toast({
        title: 'Error',
        description: 'Failed to create persona. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FeatureGate 
          feature="persona_creation"
          fallback={
            <div className="max-w-4xl mx-auto text-center py-12">
              <BrainCircuitIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Premium Feature</h2>
              <p className="text-gray-600 mb-6">Persona creation is available for Premium subscribers and above.</p>
              <Button asChild>
                <Link to="/pricing">Upgrade to Premium</Link>
              </Button>
            </div>
          }
        >
          <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Create Your AI Persona</h1>
            <p className="mt-4 text-lg text-gray-600">
              Design your AI persona for video generation and interactive conversations
            </p>
          </div>

          {/* Progress steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full ${
                      step >= i ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step > i ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <span className="text-sm font-medium">{i}</span>
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      step >= i ? 'text-primary-600' : 'text-gray-500'
                    } hidden sm:block`}
                  >
                    {i === 1
                      ? 'Choose Template'
                      : i === 2
                      ? 'Select Traits'
                      : i === 3
                      ? 'Customize'
                      : 'Review'}
                  </span>
                </div>
              ))}
            </div>
            <div className="overflow-hidden h-2 mb-4 flex rounded bg-gray-200">
              <div
                style={{ width: `${(step / 4) * 100}%` }}
                className="bg-primary-600 transition-all duration-300"
              ></div>
            </div>
          </div>

          {/* Step content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Choose a starting template or start from scratch
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {/* Start from scratch card */}
                  <Card
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedTemplate === 'scratch' ? 'ring-2 ring-primary-600' : 'hover:shadow-md'
                    }`}
                    onClick={() => handleSelectTemplate('scratch')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center">
                        <Plus className="h-5 w-5 mr-2 text-primary-600" />
                        Start from Scratch
                      </CardTitle>
                      <CardDescription>Build your persona completely custom</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 bg-gray-100 rounded-md flex items-center justify-center">
                        <BrainCircuitIcon className="h-16 w-16 text-gray-300" />
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Circle
                            className={`h-4 w-4 mr-2 ${
                              selectedTemplate === 'scratch' ? 'text-primary-600 fill-primary-600' : ''
                            }`}
                          />
                          Select
                        </div>
                        <span className="text-xs text-gray-500">0 traits selected</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Template cards */}
                  {PERSONA_TEMPLATES.slice(0, 5).map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedTemplate === template.id ? 'ring-2 ring-primary-600' : 'hover:shadow-md'
                      }`}
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle>{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 rounded-md overflow-hidden">
                          <img
                            src={template.imageUrl}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Circle
                              className={`h-4 w-4 mr-2 ${
                                selectedTemplate === template.id
                                  ? 'text-primary-600 fill-primary-600'
                                  : ''
                              }`}
                            />
                            Select
                          </div>
                          <span className="text-xs text-gray-500">
                            {template.traits.length} traits included
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button onClick={nextStep} disabled={!selectedTemplate} className="ml-3">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Select personality traits for your AI persona
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Choose the traits that define your persona's character and behavior. Selected traits
                  will influence how your persona interacts.
                </p>

                <div className="space-y-8">
                  {/* Personality traits */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Personality
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {PERSONALITY_TRAITS.map((trait) => (
                        <div
                          key={trait.id}
                          className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedTraits.some((t) => t.id === trait.id)
                              ? 'bg-primary-50 border-primary-300'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => handleTraitSelection(trait)}
                        >
                          <div
                            className={`h-4 w-4 rounded-full mr-3 flex items-center justify-center border ${
                              selectedTraits.some((t) => t.id === trait.id)
                                ? 'border-primary-600 bg-primary-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedTraits.some((t) => t.id === trait.id) && (
                              <div className="h-2 w-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{trait.name}</p>
                            <p className="text-xs text-gray-500">{trait.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Voice traits */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <Mic className="h-5 w-5 mr-2 text-primary-600" />
                      Voice
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {VOICE_TRAITS.map((trait) => (
                        <div
                          key={trait.id}
                          className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedTraits.some((t) => t.id === trait.id)
                              ? 'bg-primary-50 border-primary-300'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => handleTraitSelection(trait)}
                        >
                          <div
                            className={`h-4 w-4 rounded-full mr-3 flex items-center justify-center border ${
                              selectedTraits.some((t) => t.id === trait.id)
                                ? 'border-primary-600 bg-primary-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedTraits.some((t) => t.id === trait.id) && (
                              <div className="h-2 w-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{trait.name}</p>
                            <p className="text-xs text-gray-500">{trait.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Behavior traits */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
                      Behavior
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {BEHAVIOR_TRAITS.map((trait) => (
                        <div
                          key={trait.id}
                          className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedTraits.some((t) => t.id === trait.id)
                              ? 'bg-primary-50 border-primary-300'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => handleTraitSelection(trait)}
                        >
                          <div
                            className={`h-4 w-4 rounded-full mr-3 flex items-center justify-center border ${
                              selectedTraits.some((t) => t.id === trait.id)
                                ? 'border-primary-600 bg-primary-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedTraits.some((t) => t.id === trait.id) && (
                              <div className="h-2 w-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{trait.name}</p>
                            <p className="text-xs text-gray-500">{trait.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Knowledge traits */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <BrainCircuitIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Knowledge
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {KNOWLEDGE_TRAITS.map((trait) => (
                        <div
                          key={trait.id}
                          className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedTraits.some((t) => t.id === trait.id)
                              ? 'bg-primary-50 border-primary-300'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => handleTraitSelection(trait)}
                        >
                          <div
                            className={`h-4 w-4 rounded-full mr-3 flex items-center justify-center border ${
                              selectedTraits.some((t) => t.id === trait.id)
                                ? 'border-primary-600 bg-primary-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedTraits.some((t) => t.id === trait.id) && (
                              <div className="h-2 w-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{trait.name}</p>
                            <p className="text-xs text-gray-500">{trait.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={nextStep} disabled={selectedTraits.length === 0}>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Customize your AI persona
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Fine-tune the details to make your persona unique and tailored to your needs.
                </p>

                <div className="space-y-6">
                  {/* Persona name */}
                  <div>
                    <label htmlFor="persona-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Persona Name
                    </label>
                    <input
                      type="text"
                      id="persona-name"
                      value={personaName}
                      onChange={(e) => setPersonaName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter a name for your persona"
                    />
                  </div>

                  {/* Persona description */}
                  <div>
                    <label
                      htmlFor="persona-description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="persona-description"
                      value={personaDescription}
                      onChange={(e) => setPersonaDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Describe your persona's purpose and personality"
                    ></textarea>
                  </div>

                  {/* Trait adjustments */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Sparkles className="h-4 w-4 mr-1 text-primary-600" />
                      Selected Traits (Adjust intensity where applicable)
                    </h3>
                    <div className="space-y-4">
                      {selectedTraits.map((trait) => (
                        <div key={trait.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{trait.name}</p>
                              <p className="text-xs text-gray-500">{trait.description}</p>
                            </div>
                            <button
                              onClick={() => handleTraitSelection(trait)}
                              className="text-xs text-gray-500 hover:text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                          {trait.intensity !== undefined && (
                            <div className="mt-3">
                              <label
                                htmlFor={`intensity-${trait.id}`}
                                className="block text-xs font-medium text-gray-700 mb-1"
                              >
                                Intensity: {trait.intensity || 50}%
                              </label>
                              <input
                                type="range"
                                id={`intensity-${trait.id}`}
                                min="0"
                                max="100"
                                defaultValue={trait.intensity || 50}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={nextStep} disabled={!personaName || !personaDescription}>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Review your AI persona</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Review all the details of your persona before creating it.
                </p>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{personaName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{personaDescription}</p>
                      </div>
                      <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <BrainCircuitIcon className="h-8 w-8 text-primary-600" />
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Traits</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTraits.map((trait) => (
                          <span
                            key={trait.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {trait.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tavus AI Features */}
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">Available Features</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                          <Video className="h-5 w-5 text-primary-600 mt-1" />
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">Video Generation</h5>
                            <p className="text-xs text-gray-600">Create personalized videos with your AI persona</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-primary-600 mt-1" />
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">Interactive Chat</h5>
                            <p className="text-xs text-gray-600">Have real-time conversations with your persona</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-6 py-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        After creation, you'll be taken to the persona management page where you can start generating videos
                        and interacting with your AI persona.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleCreatePersona} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Persona <Sparkles className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}          </motion.div>
        </div>
        </FeatureGate>
      </div>
    </div>
  );
}