
import { useEffect, useState } from 'react';
import { MonacoEditor } from './MonacoEditor';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileCode, AlertCircle } from 'lucide-react';

interface CvlCodeViewerProps {
  projectId: string;
}

export function CvlCodeViewer({ projectId }: CvlCodeViewerProps) {
  const [cvlCode, setCvlCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCvlCode = async () => {
      if (!projectId) return;

      setIsLoading(true);
      setError(null);

      try {
        // First try to get CVL code from cvl_used field
        const { data: results, error: fetchError } = await supabase
          .from('verification_results')
          .select('cvl_code, spec_used, created_at')
          .eq('project_id', projectId)
          .eq('level', 'deep')
          .not('cvl_code', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        if (results && results.length > 0) {
          const cvl = results[0].cvl_code || results[0].spec_used || '';
          setCvlCode(cvl);
        } else {
          // Try to get any verification with CVL code
          const { data: fallbackResults, error: fallbackError } = await supabase
            .from('verification_results')
            .select('cvl_code, spec_used, created_at')
            .eq('project_id', projectId)
            .or('cvl_code.not.is.null,spec_used.not.is.null')
            .order('created_at', { ascending: false })
            .limit(1);

          if (fallbackError) throw fallbackError;

          if (fallbackResults && fallbackResults.length > 0) {
            const cvl = fallbackResults[0].cvl_code || fallbackResults[0].spec_used || '';
            setCvlCode(cvl);
          } else {
            setCvlCode('');
          }
        }
      } catch (err) {
        console.error('Error fetching CVL code:', err);
        setError('Failed to load CVL code');
        setCvlCode('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCvlCode();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading CVL code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!cvlCode) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No CVL Code Available</h3>
          <p className="text-muted-foreground mb-4">
            Run a deep verification to generate CVL code for formal verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <MonacoEditor 
        value={cvlCode}
        onChange={() => {}} // Read-only
        options={{
          readOnly: true,
          language: 'plaintext',
          minimap: { enabled: true },
          wordWrap: 'on',
          theme: 'vs-dark'
        }}
        height="100%"
      />
    </div>
  );
}
