
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { VerificationResult, VerificationStatus } from '@/types';

interface UseRealtimeVerificationProps {
  projectId?: string;
  onVerificationUpdate?: (result: VerificationResult | null) => void;
}

export function useRealtimeVerification({ projectId, onVerificationUpdate }: UseRealtimeVerificationProps) {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const subscriptionRef = useRef<any>(null);

  // Fetch latest verification
  const fetchLatestVerification = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('verification_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const result = data?.[0] || null;
      setVerificationResult(result);
      
      // Set loading state based on verification status
      setIsLoading(result?.status === VerificationStatus.RUNNING || result?.status === VerificationStatus.PENDING);
      
      if (onVerificationUpdate) {
        onVerificationUpdate(result);
      }
    } catch (error) {
      console.error('Error fetching verification:', error);
      setVerificationResult(null);
      setIsLoading(false);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!projectId) return;

    // Initial fetch
    fetchLatestVerification();

    // Setup real-time subscription
    subscriptionRef.current = supabase
      .channel('verification_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'verification_results',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Real-time verification update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newResult = payload.new as VerificationResult;
            setVerificationResult(newResult);
            
            // Update loading state instantly
            setIsLoading(
              newResult.status === VerificationStatus.RUNNING || 
              newResult.status === VerificationStatus.PENDING
            );
            
            if (onVerificationUpdate) {
              onVerificationUpdate(newResult);
            }
          } else if (payload.eventType === 'DELETE') {
            setVerificationResult(null);
            setIsLoading(false);
            if (onVerificationUpdate) {
              onVerificationUpdate(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [projectId, onVerificationUpdate]);

  return {
    verificationResult,
    isLoading,
    refetch: fetchLatestVerification
  };
}
