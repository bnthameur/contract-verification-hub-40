import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationIssue, VerificationLevel, VerificationResult, VerificationStatus } from "@/types";
import { 
  CheckCircle, AlertTriangle, XCircle, Play, Loader2, Terminal, 
  Shield, ShieldAlert, ShieldCheck, Square, ExternalLink, History
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { VerificationIssuesList } from "./VerificationIssuesList";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerificationPanelProps {
  projectId: string;
  code: string;
  onVerify: (level: VerificationLevel) => void;
  onStop?: () => void;
  result?: VerificationResult;
  onNavigateToLine?: (line: number) => void;
  onSwitchTab?: (tab: string) => void;
}

// Update API URL to match the running backend
const API_URL = "http://127.0.0.1:8000";

const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`, { 
      method: 'GET',
      mode: 'cors',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'omit',
      cache: 'no-cache'
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
  onNavigateToLine,
  onSwitchTab
}: VerificationPanelProps) {
  const [level, setLevel] = useState<VerificationLevel>(VerificationLevel.SIMPLE);
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [currentTab, setCurrentTab] = useState("verification");
  const [specifications, setSpecifications] = useState("");
  const [specificationsDraft, setSpecificationsDraft] = useState("");
  const [isConfirmingLogic, setIsConfirmingLogic] = useState(false);
  const { toast } = useToast();
  
  const isPending = result?.status === VerificationStatus.PENDING;
  const isRunning = result?.status === VerificationStatus.RUNNING || isVerifying;
  const isComplete = result?.status === VerificationStatus.COMPLETED;
  const isFailed = result?.status === VerificationStatus.FAILED;
  const isAwaitingConfirmation = result?.status === VerificationStatus.AWAITING_CONFIRMATION;

  const hasErrors = Array.isArray(result?.results) && 
    result.results.some(issue => issue.type === 'error');

  const errorCount = Array.isArray(result?.results) ? 
    result.results.filter(issue => issue.type === 'error').length : 0;

  const warningCount = Array.isArray(result?.results) ? 
    result.results.filter(issue => issue.type === 'warning').length : 0;

  const infoCount = Array.isArray(result?.results) ? 
    result.results.filter(issue => issue.type === 'info').length : 0;

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
    
    const intervalId = setInterval(checkApi, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (result?.spec_draft && isAwaitingConfirmation) {
      try {
        const parsedspec = typeof result.spec_draft === 'string' 
          ? JSON.parse(result.spec_draft) 
          : result.spec_draft;
        
        const specContent = parsedspec.content || parsedspec;
        setSpecificationsDraft(typeof specContent === 'string' ? specContent : JSON.stringify(specContent, null, 2));
        
        if (onSwitchTab) {
          onSwitchTab("logic-validation");
          setCurrentTab("logic-validation");
        }
      } catch (error) {
        console.error("Error parsing specifications:", error);
        setSpecificationsDraft(JSON.stringify(result.spec_draft, null, 2));
      }
    }
  }, [result, onSwitchTab]);

  const handleStartVerification = async () => {
    if (!projectId || !code) {
      toast({
        title: "Verification failed",
        description: "Project or code is missing",
        variant: "destructive",
      });
      return;
    }
  
    setIsVerifying(true);
    setApiError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      // Use the appropriate endpoint based on the selected verification level
      const endpoint = level === VerificationLevel.DEEP 
        ? `${API_URL}/verify/deep` 
        : `${API_URL}/verify/simple`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ project_id: projectId }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      onVerify(level);
      
      const verificationTypeLabel = level === VerificationLevel.DEEP 
        ? "Deep verification" 
        : "Verification";
      
      toast({
        title: `${verificationTypeLabel} started`,
        description: level === VerificationLevel.DEEP 
          ? "Generating specifications for your contract..." 
          : "Analysis is running in the background.",
      });
      
      if (level === VerificationLevel.DEEP && onSwitchTab) {
        // Only switch to logic validation if we're doing a deep verification
        // This will happen automatically when the result comes back with AWAITING_CONFIRMATION status
      }
    } catch (error: any) {
      console.error(`${level} verification error:`, error);
      setApiError(error.message || `Failed to start ${level} verification.`);
      
      toast({
        title: "Verification failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStopVerification = async () => {
    if (!onStop || !result) return;
    onStop();
  };

  const handleConfirmLogic = async () => {
    if (!result?.id) {
      toast({
        title: "Confirmation failed",
        description: "No active verification session",
        variant: "destructive",
      });
      return;
    }
    
    setIsConfirmingLogic(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      const response = await fetch(`${API_URL}/verify/confirm/${result.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ spec_draft: specificationsDraft }), // Changed from specifications to spec_draft
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      onVerify(VerificationLevel.DEEP);
      
      toast({
        title: "Logic confirmed",
        description: "Deep verification is now running with your specifications",
      });
      
      if (onSwitchTab) {
        onSwitchTab("verification");
        setCurrentTab("verification");
      }
      
    } catch (error: any) {
      console.error("Logic confirmation error:", error);
      
      toast({
        title: "Confirmation failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingLogic(false);
    }
  };

  useEffect(() => {
    if ((isRunning || isPending) && result?.id) {
      const interval = setInterval(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const authToken = session?.access_token;
          
          const response = await fetch(`${API_URL}/verification/${result.id}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': authToken ? `Bearer ${authToken}` : ''
            },
            mode: 'cors',
            credentials: 'omit',
          });
          
          if (!response.ok) {
            throw new Error(`API Error (${response.status})`);
          }
          
          const data = await response.json();
          
          if (data.status !== result.status) {
            onVerify(level);
          }
        } catch (error) {
          console.error("Error polling verification status:", error);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isRunning, isPending, result?.id, result?.status]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Verification Tools
            </CardTitle>
            <CardDescription>
              Verify your Solidity code for errors and vulnerabilities
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="gap-1.5"
                >
                  <Link to={`/verification-history/${projectId}`}>
                    <History className="h-4 w-4" />
                    View History
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View full verification history</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {currentTab === "verification" && (
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
                    Simple
                  </SelectItem>
                  <SelectItem value={VerificationLevel.DEEP}>
                    Deep
                  </SelectItem>
                  <SelectItem value={VerificationLevel.FORMAL} disabled>
                    Formal 🔒
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
                    {result?.logs?.length || 0} steps
                  </span>
                </div>
                <Progress value={result?.logs?.length ? (result.logs.length / 10) * 100 : 10} className="h-2" />
              </div>
            )}

            {(isComplete || isFailed) && (
              <Tabs defaultValue="issues">
                <div className="flex items-center justify-between mb-2">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="issues" className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Issues {result?.results?.length ? `(${result.results.length})` : ''}
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
                </div>
                
                <TabsContent value="issues" className="h-96">
                  {Array.isArray(result?.results) ? (
                    <VerificationIssuesList 
                      issues={result.results} 
                      onNavigateToLine={onNavigateToLine}
                      maxHeight="calc(100vh - 400px)"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No issues found or results not available
                    </div>
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
                            <span className="font-medium">
                              {Array.isArray(result?.results) ? result.results.length : 0}
                            </span>
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
        )}

        {currentTab === "logic-validation" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Contract Logic Specifications</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Review and edit the AI-generated specifications for your smart contract. These specifications will be used for formal verification.
              </p>
              
              <Textarea 
                className="h-96 font-mono text-sm"
                placeholder="Loading specifications..."
                value={specificationsDraft}
                onChange={(e) => setSpecificationsDraft(e.target.value)}
                disabled={isConfirmingLogic}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (onSwitchTab) {
                    onSwitchTab("verification");
                    setCurrentTab("verification");
                  }
                }}
                disabled={isConfirmingLogic}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmLogic}
                disabled={isConfirmingLogic || !specificationsDraft}
                className="flex-1"
              >
                {isConfirmingLogic ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Specifications
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      {currentTab === "verification" && (
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
      )}
    </Card>
  );
}
