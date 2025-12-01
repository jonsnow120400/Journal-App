import { supabase } from './supabaseClient';
import { User, JournalEntry } from '../types';

// --- Auth Helpers ---

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || 'Friend',
    };
  }
  return null;
};

export const registerUser = async (email: string, name: string, password: string): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const loginUser = async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { user: null, error: error.message };
  
  if (data.user) {
    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || 'Friend',
      },
    };
  }

  return { user: null, error: 'Unknown error' };
};

export const logoutUser = async (): Promise<void> => {
  await supabase.auth.signOut();
};

// --- Journal Helpers ---

// Map Supabase DB row to JournalEntry type
const mapEntryFromDB = (row: any): JournalEntry => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  content: row.content,
  date: row.date,
  mood: row.mood as JournalEntry['mood'],
  tags: row.tags || [],
  aiVibeCheck: row.ai_vibe_check,
});

export const getEntries = async (): Promise<JournalEntry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    return [];
  }

  return (data || []).map(mapEntryFromDB);
};

export const saveEntry = async (entry: JournalEntry): Promise<{ success: boolean; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "User not logged in" };

  const dbEntry = {
    // If id is newly generated client-side, we can use it, or let DB generate it. 
    // To support upsert with client-side UUIDs:
    id: entry.id,
    user_id: user.id,
    title: entry.title,
    content: entry.content,
    date: entry.date,
    mood: entry.mood,
    tags: entry.tags,
    ai_vibe_check: entry.aiVibeCheck,
  };

  const { error } = await supabase
    .from('entries')
    .upsert(dbEntry);

  if (error) {
    console.error("Error saving entry:", error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
};

export const deleteEntry = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting entry:", error);
    return false;
  }
  return true;
};