import React, { useState } from 'react';
import { createPersona } from '@/lib/api/personas';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreatePage() {
  // Previous state declarations remain the same...
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [personaName, setPersonaName] = useState('');
  const [personaDescription, setPersonaDescription] = useState('');
  const [selectedTraits, setSelectedTraits] = useState([]);

  const handleCreatePersona = async () => {
    try {
      setIsCreating(true);

      const { data, error } = await createPersona({
        name: personaName,
        description: personaDescription,
        traits: selectedTraits,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your persona has been created successfully.",
      });

      // Navigate to the dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating persona:', err);
      toast({
        title: "Error",
        description: "Failed to create persona. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <Button 
        onClick={handleCreatePersona} 
        disabled={isCreating || !personaName || !personaDescription}
      >
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
  );
}