import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming Input component exists
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming Select component exists
import { createPersona } from '@/lib/api/personas';
import { Loader2 } from 'lucide-react';

const REPLICA_TYPES = ['personal', 'historical', 'professional', 'emergency', 'creator'];

export function PersonaCreateForm({ onSuccess }: { onSuccess?: (personaId: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [replicaType, setReplicaType] = useState<string>('');
  // Add state for traits, imageUrl etc. as needed
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !replicaType) {
      setError('Name and Replica Type are required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createPersona({
        name,
        description,
        replicaType,
        traits: [], // Placeholder for traits
        // imageUrl: imageUrl, // Add if image upload is implemented
      });

      if (result.error) {
        throw result.error;
      }

      if (result.data) {
        // Reset form
        setName('');
        setDescription('');
        setReplicaType('');
        onSuccess?.(result.data.id);
      } else {
        throw new Error('Failed to create persona, no data returned.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error creating persona:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label htmlFor="replicaType" className="block text-sm font-medium">Replica Type</label>
        <Select value={replicaType} onValueChange={setReplicaType} required>
          <SelectTrigger id="replicaType">
            <SelectValue placeholder="Select a type..." />
          </SelectTrigger>
          <SelectContent>
            {REPLICA_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add fields for traits, image upload etc. here */}

      {error && (
        <div className="text-sm text-red-600">
          Error: {error}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Persona'
        )}
      </Button>
    </form>
  );
}

