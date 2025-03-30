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

// Function to ensure a user profile exists in the profiles table
export async function ensureUserProfile(userId: string, email: string) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing profile:', fetchError);
      return null;
    }
    
    // If profile exists, return it
    if (existingProfile) {
      console.log('Existing profile found:', existingProfile);
      return existingProfile;
    }
    
    // Otherwise, create a new profile
    console.log('Creating new profile for user:', userId);
    
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return null;
    }
    
    console.log('New profile created:', newProfile);
    return newProfile;
  } catch (error) {
    console.error('Unexpected error in ensureUserProfile:', error);
    return null;
  }
}
