import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper functions for common operations
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getCurrentUserProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) throw error;
  return data;
};

export const getCurrentMember = async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      user:users(*),
      fee_package:fee_packages(*)
    `)
    .eq('user_id', user.id)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
};

// Storage helpers
export const uploadProfilePhoto = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/profile.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('profile-photos')
    .upload(fileName, file, {
      upsert: true
    });
    
  if (error) throw error;
  return data;
};

export const uploadReceipt = async (memberId: string, billId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${memberId}/${billId}_receipt.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file);
    
  if (error) throw error;
  return data;
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return data.publicUrl;
};

export default supabase;