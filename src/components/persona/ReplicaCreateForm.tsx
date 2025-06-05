import React from 'react';
import { ReplicaCreateForm } from '@/components/persona/ReplicaCreateForm';

function CreateReplicaPage() {
  const handleReplicaSuccess = (data: any) => {
    console.log('Replica creation initiated:', data);
    // Maybe navigate user or show a persistent success message
    // data contains { replica_id, status, message }
  };

  const handleReplicaError = (error: Error) => {
    console.error('Replica creation failed:', error);
    // Show error message to user
  };

  return (
    <div>
      <h1>Create a New AI Replica</h1>
      <ReplicaCreateForm 
        onSuccess={handleReplicaSuccess} 
        onError={handleReplicaError} 
      />
    </div>
  );
}

export default CreateReplicaPage;
