export interface User {
  id: string;
  email: string;
  name: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: string; // ISO string
  mood: 'happy' | 'sad' | 'neutral' | 'angry' | 'excited' | 'tired' | 'chill';
  tags: string[];
  aiVibeCheck?: string;
}

export type ViewState = 'auth' | 'home' | 'create' | 'edit' | 'view';

export const MOOD_EMOJIS: Record<JournalEntry['mood'], string> = {
  happy: '✨',
  sad: '🌧️',
  neutral: '😐',
  angry: '🤬',
  excited: '🔥',
  tired: '😴',
  chill: '🌊'
};