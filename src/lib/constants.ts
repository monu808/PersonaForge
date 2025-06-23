import * as React from 'react';
import { HomeIcon, PlusCircleIcon, LayoutDashboardIcon, BrainCircuitIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { NavItem, PersonaTemplate, PersonaTrait } from './types';

export const NAV_ITEMS: NavItem[] = [
	{
		title: 'Home',
		href: '/',
		icon: React.createElement(HomeIcon),
	},
	{
		title: 'Create',
		href: '/create',
		icon: React.createElement(PlusCircleIcon),
	},
	{
		title: 'Dashboard',
		href: '/dashboard',
		icon: React.createElement(LayoutDashboardIcon),
	},
	{
		title: 'My Personas',
		href: '/personas',
		icon: React.createElement(BrainCircuitIcon),
	},
	{
		title: 'Profile',
		href: '/profile',
		icon: React.createElement(UserIcon),
	},
	{
		title: 'Settings',
		href: '/settings',
		icon: React.createElement(SettingsIcon),
	},
];

export const PERSONALITY_TRAITS: PersonaTrait[] = [
	{ id: '1', name: 'Friendly', description: 'Warm and approachable', category: 'personality' },
	{ id: '2', name: 'Professional', description: 'Formal and business-like', category: 'personality' },
	{ id: '3', name: 'Empathetic', description: 'Understanding and compassionate', category: 'personality' },
	{ id: '4', name: 'Analytical', description: 'Logical and detail-oriented', category: 'personality' },
	{ id: '5', name: 'Creative', description: 'Imaginative and innovative', category: 'personality' },
	{ id: '6', name: 'Assertive', description: 'Confident and decisive', category: 'personality' },
];

export const VOICE_TRAITS: PersonaTrait[] = [
	{ id: '7', name: 'Calm', description: 'Soothing and measured tone', category: 'voice' },
	{ id: '8', name: 'Energetic', description: 'Vibrant and dynamic tone', category: 'voice' },
	{ id: '9', name: 'Authoritative', description: 'Commanding and confident tone', category: 'voice' },
	{ id: '10', name: 'Gentle', description: 'Soft and reassuring tone', category: 'voice' },
];

export const BEHAVIOR_TRAITS: PersonaTrait[] = [
	{ id: '11', name: 'Proactive', description: 'Takes initiative without prompting', category: 'behavior' },
	{ id: '12', name: 'Responsive', description: 'Reacts quickly to input', category: 'behavior' },
	{ id: '13', name: 'Detailed', description: 'Provides comprehensive information', category: 'behavior' },
	{ id: '14', name: 'Concise', description: 'Communicates briefly and efficiently', category: 'behavior' },
];

export const KNOWLEDGE_TRAITS: PersonaTrait[] = [
	{ id: '15', name: 'Technical', description: 'Specialized in technical subjects', category: 'knowledge' },
	{ id: '16', name: 'Medical', description: 'Well-versed in medical information', category: 'knowledge' },
	{ id: '17', name: 'Financial', description: 'Knowledgeable about finance and economics', category: 'knowledge' },
	{ id: '18', name: 'Educational', description: 'Focuses on teaching and learning', category: 'knowledge' },
];

export const PERSONA_TEMPLATES: PersonaTemplate[] = [
	{
		id: '1',
		name: 'Professional Assistant',
		description: 'A reliable assistant for business and productivity tasks',
		imageUrl: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
		traits: [
			PERSONALITY_TRAITS[1], // Professional
			VOICE_TRAITS[2], // Authoritative
			BEHAVIOR_TRAITS[1], // Responsive
			KNOWLEDGE_TRAITS[0], // Technical
		],
		category: 'professional',
		type: 'professional',
		popularity: 92,
	},
	{
		id: '2',
		name: 'Empathetic Companion',
		description: 'A caring and understanding companion for emotional support',
		imageUrl: 'https://images.pexels.com/photos/7176305/pexels-photo-7176305.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
		traits: [
			PERSONALITY_TRAITS[2], // Empathetic
			VOICE_TRAITS[3], // Gentle
			BEHAVIOR_TRAITS[0], // Proactive
			KNOWLEDGE_TRAITS[3], // Educational
		],
		category: 'companion',
		type: 'personal',
		popularity: 88,
	},
	{
		id: '3',
		name: 'Creative Collaborator',
		description: 'An innovative partner for creative projects and brainstorming',
		imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
		traits: [
			PERSONALITY_TRAITS[4], // Creative
			VOICE_TRAITS[1], // Energetic
			BEHAVIOR_TRAITS[2], // Detailed
			KNOWLEDGE_TRAITS[3], // Educational
		],
		category: 'assistant',
		type: 'creator',
		popularity: 85,
	},
	{
		id: '4',
		name: 'Medical Advisor',
		description: 'A knowledgeable guide for health and wellness information',
		imageUrl: 'https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
		traits: [
			PERSONALITY_TRAITS[3], // Analytical
			VOICE_TRAITS[0], // Calm
			BEHAVIOR_TRAITS[2], // Detailed
			KNOWLEDGE_TRAITS[1], // Medical
		],
		category: 'specialized',
		type: 'professional',
		popularity: 79,
	},
	{
		id: '5',
		name: 'Financial Consultant',
		description: 'An expert in financial planning and investment strategies',
		imageUrl: 'https://images.pexels.com/photos/7235679/pexels-photo-7235679.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
		traits: [
			PERSONALITY_TRAITS[3], // Analytical
			VOICE_TRAITS[2], // Authoritative
			BEHAVIOR_TRAITS[2], // Detailed
			KNOWLEDGE_TRAITS[2], // Financial
		],
		category: 'specialized',
		type: 'professional',
		popularity: 76,
	},
	{
		id: '6',
		name: 'Friendly Guide',
		description: 'A warm and approachable companion for everyday assistance',
		imageUrl: 'https://images.pexels.com/photos/8435919/pexels-photo-8435919.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
		traits: [
			PERSONALITY_TRAITS[0], // Friendly
			VOICE_TRAITS[1], // Energetic
			BEHAVIOR_TRAITS[1], // Responsive
			KNOWLEDGE_TRAITS[3], // Educational
		],
		category: 'companion',
		type: 'personal',
		popularity: 90,
	},
];

// Storage bucket configuration
export const STORAGE_BUCKETS = {
	REPLICA_TRAINING_VIDEOS: 'replica-training-videos',
	PERSONA_AVATARS: 'persona-avatars',
	GENERATED_VIDEOS: 'generated-videos',
	AUDIO_FILES: 'audio-files',
	CONVERSATION_RECORDINGS: 'conversation-recordings',
	// Legacy bucket for backward compatibility
	PERSONA_CONTENT: 'persona-content',
} as const;

// File size limits (in bytes) - Supabase storage server limits
export const FILE_SIZE_LIMITS = {
	TRAINING_VIDEO: 52428800, // 50MB (Supabase server limit)
	AVATAR_IMAGE: 10485760, // 10MB
	GENERATED_VIDEO: 52428800, // 50MB  
	AUDIO_FILE: 52428800, // 50MB
	CONVERSATION_RECORDING: 52428800, // 50MB
} as const;

// Allowed MIME types for each bucket
export const ALLOWED_MIME_TYPES = {
	TRAINING_VIDEOS: [
		'video/mp4',
		'video/webm',
		'video/quicktime',
		'video/x-msvideo',
		'video/mov',
	],
	AVATARS: [
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/webp',
		'image/gif',
	],
	VIDEOS: [
		'video/mp4',
		'video/webm',
		'video/quicktime',
		'video/x-msvideo',
	],
	AUDIO: [
		'audio/mpeg',
		'audio/wav',
		'audio/mp3',
		'audio/m4a',
		'audio/ogg',
		'audio/webm',
		'audio/aac',
		'audio/flac',
	],
	CONVERSATIONS: [
		'video/mp4',
		'video/webm',
		'audio/mpeg',
		'audio/wav',
		'audio/mp3',
		'audio/m4a',
		'audio/ogg',
		'audio/webm',
	],
} as const;