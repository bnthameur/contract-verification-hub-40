
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
  
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      console.log(`Checking profile for user ${userId} with email ${email} (attempt ${retries + 1})`);
      
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
          
          // If this is a temporary error, retry
          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
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
        // Check if it's a duplicate key error (profile was created in another concurrent request)
        if (insertError.code === '23505') {
          console.log('Profile was created concurrently, fetching it');
          const { data: concurrentProfile, error: refetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (refetchError) {
            console.error('Error fetching concurrent profile:', refetchError);
            throw refetchError;
          }
          
          return concurrentProfile;
        } else {
          console.error('Error creating user profile:', insertError);
          throw insertError;
        }
      }
      
      console.log('Successfully created profile:', newProfile);
      return newProfile;
    } catch (error) {
      console.error(`Error ensuring user profile exists (attempt ${retries + 1}):`, error);
      
      retries++;
      if (retries < maxRetries) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      return null;
    }
  }
  
  console.error('Failed to ensure profile exists after maximum retries');
  return null;
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
