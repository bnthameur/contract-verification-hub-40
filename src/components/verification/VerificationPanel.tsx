import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationIssue, VerificationLevel, VerificationResult, VerificationStatus } from "@/types";
import { 
  CheckCircle, AlertTriangle, XCircle, Play, Loader2, Terminal, 
  Shield, ShieldAlert, ShieldCheck, Square 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { VerificationIssuesList } from "./VerificationIssuesList";

interface VerificationPanelProps {
  projectId: string;
  code: string;
  onVerify: (level: VerificationLevel) => void;
  onStop?: () => void;
  result?: VerificationResult;
  onNavigateToLine?: (line: number) => void;
}

// Get API URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || "https://58efc0c8-52f0-4b94-abcc-024e3f64d36c-backend.lovableproject.com";

// Function to check API availability with improved CORS handling
const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/`, { 
      method: 'GET',
      mode: 'cors',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'omit', // Don't send credentials to avoid CORS preflight issues
      cache: 'no-cache' // Prevent caching
    });
    
    return response.ok;
  } catch (error) {
    console.error("API availability check failed:", error);
    return false;
  }
};

export function VerificationPanel({ 
  projectId, 
  code, 
  onVerify, 
  onStop, 
  result,
  onNavigateToLine 
}: VerificationPanelProps) {
  const [level, setLevel] = useState<VerificationLevel>(VerificationLevel.SIMPLE);
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  const isPending = result?.status === VerificationStatus.PENDING;
  const isRunning = result?.status === VerificationStatus.RUNNING || isVerifying;
  const isComplete = result?.status === VerificationStatus.COMPLETED;
  const isFailed = result?.status === VerificationStatus.FAILED;
  
  const hasErrors = result?.results.some(issue => issue.type === 'error');
  const errorCount = result?.results.filter(issue => issue.type === 'error').length || 0;
  const warningCount = result?.results.filter(issue => issue.type === 'warning').length || 0;
  const infoCount = result?.results.filter(issue => issue.type === 'info').length || 0;

  // Check API availability when component mounts
  useEffect(() => {
    const checkApi = async () => {
      try {
        const isAvailable = await checkApiAvailability();
        setApiAvailable(isAvailable);
        
        if (!isAvailable) {
          console.log("API not available at:", API_URL);
          setApiError("Verification API is not available. Please try again later.");
        } else {
          console.log("API is available at:", API_URL);
          setApiError(null);
        }
      } catch (error) {
        console.error("Error checking API availability:", error);
        setApiAvailable(false);
        setApiError("Error connecting to verification API.");
      }
    };
    
    checkApi();
    
    // Check API availability periodically
    const intervalId = setInterval(checkApi, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const handleStartVerification = async () => {
    if (!projectId || !code) {
      toast({
        title: "Verification failed",
        description: "Project or code is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifying(true);
      setApiError(null);
      
      // Get auth token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      // Create initial verification record
      const initialResult: Partial<VerificationResult> = {
        project_id: projectId,
        level,
        status: VerificationStatus.RUNNING,
        results: [],
        logs: ["Initializing verification..."],
        created_at: new Date().toISOString(),
      };
      
      const { data: verificationRecord, error: insertError } = await supabase
        .from('verification_results')
        .insert(initialResult)
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      // Call the backend API with auth token
      console.log(`Calling API at: ${API_URL}/analyze`);
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        },
        mode: 'cors',
        credentials: 'omit', // Don't send credentials to avoid CORS preflight issues
        body: JSON.stringify({
          code,
          project_id: projectId,
          auth_token: authToken
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      // Refresh to get updated result - this will trigger a reload of results from Supabase
      onVerify(level);
      
      toast({
        title: "Verification complete",
        description: `Analysis completed with ${data.issues_count || 0} issues found.`,
      });
      
    } catch (error: any) {
      console.error("Verification error:", error);
      setApiError(error.message || "Failed to connect to verification API. Is the backend running?");
      
      toast({
        title: "Verification failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Update the verification record as failed if it exists
      if (result?.id) {
        await supabase
          .from('verification_results')
          .update({
            status: VerificationStatus.FAILED,
            logs: [...(result.logs || []), `Error: ${error.message}`],
            completed_at: new Date().toISOString(),
          })
          .eq('id', result.id);
      }
      
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStopVerification = async () => {
    if (!onStop || !result) return;
    onStop();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Verification Tools
        </CardTitle>
        <CardDescription>
          Verify your Solidity code for errors and vulnerabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="verification-level" className="text-sm font-medium">
              Verification Level
            </label>
            <Select
              value={level}
              onValueChange={(value) => setLevel(value as VerificationLevel)}
              disabled={isRunning}
            >
              <SelectTrigger id="verification-level">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VerificationLevel.SIMPLE}>
                  Simple (Slither)
                </SelectItem>
                <SelectItem value={VerificationLevel.MEDIUM}>
                  Medium (Z3 SMT)
                </SelectItem>
                <SelectItem value={VerificationLevel.ADVANCED} disabled>
                  Advanced (K Framework) - Coming Soon
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {apiAvailable === false && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm border border-destructive/20">
              <p className="font-medium">Verification API Unreachable</p>
              <p className="mt-1">The verification service is currently unavailable. Please try again later.</p>
              <p className="mt-2 text-xs">
                API endpoint: {API_URL}
              </p>
            </div>
          )}

          {apiError && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm border border-destructive/20">
              <p className="font-medium">API Error</p>
              <p className="mt-1">{apiError}</p>
              <p className="mt-2 text-xs">
                API endpoint: {API_URL}
              </p>
            </div>
          )}

          {(isRunning || isPending) && (
            <div className="space-y-2 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verification in progress...</span>
                <span className="text-sm text-muted-foreground">
                  {result?.logs.length || 0} steps
                </span>
              </div>
              <Progress value={result?.logs.length ? (result.logs.length / 10) * 100 : 10} className="h-2" />
            </div>
          )}

          {(isComplete || isFailed) && (
            <Tabs defaultValue="issues">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="issues" className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Issues {result?.results.length ? `(${result.results.length})` : ''}
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex items-center gap-1.5">
                  <Terminal className="h-4 w-4" />
                  Logs
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  Summary
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="issues" className="h-96">
                {result?.results && (
                  <VerificationIssuesList 
                    issues={result.results} 
                    onNavigateToLine={onNavigateToLine}
                    maxHeight="calc(100vh - 400px)"
                  />
                )}
              </TabsContent>
              
              <TabsContent value="logs" className="h-96">
                <ScrollArea className="h-full rounded-md border bg-muted/50 p-4 font-mono text-sm">
                  {result?.logs && result.logs.length > 0 ? (
                    <div className="space-y-1">
                      {result.logs.map((log, index) => (
                        <div key={index} className="text-xs">
                          <span className="text-muted-foreground">[{index + 1}]</span> {log}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No logs available
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="summary" className="h-96">
                <div className="rounded-md border p-4 h-full">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Verification Summary</h3>
                        <Badge variant={hasErrors ? "destructive" : "secondary"}>
                          {hasErrors ? "Issues Found" : "Passed"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Verification Level:</span>
                          <span className="font-medium">{result?.level}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Issues:</span>
                          <span className="font-medium">{result?.results.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Errors:</span>
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            {errorCount}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Warnings:</span>
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                            {warningCount}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Infos:</span>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                            {infoCount}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completed at:</span>
                        <span>{result?.completed_at ? new Date(result.completed_at).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {isRunning && onStop && (
          <Button 
            onClick={handleStopVerification}
            variant="outline"
            className="flex-1"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop Verification
          </Button>
        )}
        <Button 
          onClick={handleStartVerification} 
          disabled={isRunning || apiAvailable === false}
          className={isRunning && onStop ? "flex-1" : "w-full"}
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Pending...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Verification
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
