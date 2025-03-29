
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
  if (!userId || !email) {
    console.error('Cannot create profile: Missing userId or email');
    return null;
  }
  
  try {
    console.log(`Checking profile for user ${userId} with email ${email}`);
    
    // First check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.log('Profile not found, creating new one');
      } else {
        console.error('Error checking for existing profile:', fetchError);
        throw fetchError;
      }
    }
      
    // If profile already exists, return it
    if (existingProfile) {
      console.log('Profile exists:', existingProfile);
      return existingProfile;
    }
    
    console.log('Creating new profile for user:', userId);
    
    // Profile doesn't exist, create it
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error creating user profile:', insertError);
      throw insertError;
    }
    
    console.log('Successfully created profile:', newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error ensuring user profile exists:', error);
    return null;
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
