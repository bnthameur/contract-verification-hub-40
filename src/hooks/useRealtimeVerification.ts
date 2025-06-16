
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const lastProjectIdRef = useRef<string | undefined>(undefined);
  const isInitializedRef = useRef(false);

  // Stable update function to prevent unnecessary re-renders
  const updateVerificationResult = useCallback((result: VerificationResult | null) => {
    setVerificationResult(prev => {
      // Only update if there's actually a change
      if (JSON.stringify(prev) === JSON.stringify(result)) {
        return prev;
      }
      return result;
    });
    
    // Set loading state based on verification status
    const shouldBeLoading = result?.status === VerificationStatus.RUNNING || result?.status === VerificationStatus.PENDING;
    setIsLoading(prev => {
      if (prev === shouldBeLoading) return prev;
      return shouldBeLoading;
    });
    
    if (onVerificationUpdate) {
      onVerificationUpdate(result);
    }
  }, [onVerificationUpdate]);

  // Fetch latest verification
  const fetchLatestVerification = useCallback(async () => {
    if (!projectId) {
      if (isInitializedRef.current) {
        updateVerificationResult(null);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('verification_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const result = data?.[0] || null;
      updateVerificationResult(result);
      isInitializedRef.current = true;
    } catch (error) {
      console.error('Error fetching verification:', error);
      updateVerificationResult(null);
      isInitializedRef.current = true;
    }
  }, [projectId, updateVerificationResult]);

  // Setup real-time subscription
  useEffect(() => {
    // Clean up previous subscription if project changed
    if (subscriptionRef.current && lastProjectIdRef.current !== projectId) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    if (!projectId) {
      lastProjectIdRef.current = undefined;
      return;
    }

    // Only fetch if project actually changed or first time
    if (lastProjectIdRef.current !== projectId) {
      isInitializedRef.current = false;
      fetchLatestVerification();
      lastProjectIdRef.current = projectId;
    }

    // Setup real-time subscription only if we don't have one for this project
    if (!subscriptionRef.current || lastProjectIdRef.current !== projectId) {
      subscriptionRef.current = supabase
        .channel(`verification_changes_${projectId}`)
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
              updateVerificationResult(newResult);
            } else if (payload.eventType === 'DELETE') {
              updateVerificationResult(null);
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [projectId, fetchLatestVerification, updateVerificationResult]);

  return {
    verificationResult,
    isLoading,
    refetch: fetchLatestVerification
  };
}
