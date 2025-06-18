
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CompilationResult {
  abi: any[];
  bytecode: string;
  contractName: string;
  constructorInputs: any[];
}

interface UseContractCompilerReturn {
  compile: (contractCode: string, contractName?: string, projectId?: string) => Promise<CompilationResult | null>;
  isCompiling: boolean;
  error: string | null;
}

export function useContractCompiler(): UseContractCompilerReturn {
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const compile = async (
    contractCode: string, 
    contractName?: string, 
    projectId?: string
  ): Promise<CompilationResult | null> => {
    if (!contractCode.trim()) {
      setError('Contract code is required');
      return null;
    }

    setIsCompiling(true);
    setError(null);

    try {
      // In a real implementation, replace this with your Supabase Edge Function URL
      const response = await fetch('/api/compile-solidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractCode,
          contractName,
          projectId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Compilation failed');
      }

      const result = await response.json();
      
      toast({
        title: "Compilation Successful",
        description: `Contract ${result.contractName} compiled successfully`
      });

      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to compile contract';
      setError(errorMessage);
      
      toast({
        title: "Compilation Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return null;
    } finally {
      setIsCompiling(false);
    }
  };

  return {
    compile,
    isCompiling,
    error
  };
}
