
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Use environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
}

// Create the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to ensure user profile exists
export const ensureUserProfile = async (userId: string, email: string) => {
  if (!userId || !email) return;
  
  try {
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (!existingProfile) {
      // Profile doesn't exist, create it
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
      if (insertError) {
        console.error('Error creating user profile:', insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Error ensuring user profile exists:', error);
    throw error;
  }
};

// Show console warning in development if using fallback values
if (import.meta.env.DEV && (
  !import.meta.env.VITE_SUPABASE_URL || 
  !import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
  import.meta.env.VITE_SUPABASE_ANON_KEY === 'your-anon-key'
)) {
  console.warn(
    '⚠️ Using development Supabase fallbacks. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file for proper functionality.'
  );
}
