import { type ClassValue } from "clsx";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  settings?: {
    profile_visibility: 'public' | 'private';
    email_notifications: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  created_at: Date;
  updated_at: Date;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

export interface PersonaTrait {
  id: string;
  name: string;
  description: string;
  category: 'personality' | 'voice' | 'behavior' | 'knowledge';
  intensity?: number;
}

export interface PersonaTemplate {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  traits: PersonaTrait[];
  category: 'professional' | 'companion' | 'assistant' | 'specialized';
  type?: 'personal' | 'historical' | 'professional' | 'emergency' | 'creator';
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
  replica_type?: string; // Added replica_type
  nft_asset_id?: number; // Added nft_asset_id (using number for uint64)
  creator_wallet_address?: string; // Added creator_wallet_address
}