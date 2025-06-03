export interface User {
  id: string;
  name: string;
  email: string;
  role: 'creator' | 'professional' | 'emergency';
  avatarUrl?: string;
  createdAt: Date;
}

export interface PersonaTrait {
  id: string;
  name: string;
  description: string;
  category: 'personality' | 'voice' | 'behavior' | 'knowledge';
  intensity?: number; // 0-100 scale for applicable traits
}

export interface PersonaTemplate {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  traits: PersonaTrait[];
  category: 'professional' | 'companion' | 'assistant' | 'specialized';
  popularity: number;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  creatorId: string;
  traits: PersonaTrait[];
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  usageCount: number;
}

export type NavItem = {
  title: string;
  href: string;
  icon?: React.ReactNode;
};