// Previous imports remain the same...
import { createPersona } from '@/lib/api/personas';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export default function CreatePage() {
  // Previous state declarations remain the same...
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  // Previous functions remain the same...

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

  // Previous JSX remains the same until the final button...
  
  {/* Replace the final Create Persona button with: */}
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