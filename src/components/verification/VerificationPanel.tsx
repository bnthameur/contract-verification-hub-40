
import { ScrollArea } from "@/components/ui/scroll-area";
<<<<<<< HEAD
import { Card, CardContent } from "@/components/ui/card";
import { VerificationIssuesList } from "@/components/verification/VerificationIssuesList";
import { Button } from "@/components/ui/button";
import { Project, VerificationResult, VerificationStatus, VerificationLevel } from "@/types";
=======
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationIssue, VerificationLevel, VerificationResult, VerificationStatus } from "@/types";
import { 
  CheckCircle, AlertTriangle, XCircle, Play, Loader2, Terminal, 
  Shield, ShieldAlert, ShieldCheck, Square, ExternalLink, History
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
import { useState, useEffect } from "react";
import { LogicValidation } from "@/components/verification/LogicValidation";
import { supabase } from "@/lib/supabase";
<<<<<<< HEAD
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, ShieldCheck, History, ChevronDown, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
=======
import { VerificationIssuesList } from "./VerificationIssuesList";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758

interface VerificationPanelProps {
  project?: Project;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onNavigateToLine?: (line: number) => void;
  onStartVerification: (level: string) => Promise<void>;
  onCancelLogicValidation?: () => void;
  onConfirmLogicVerification?: (logicText: string) => Promise<void>;
  verificationResult?: VerificationResult;
  isRunningVerification: boolean;
  isLoadingAILogic: boolean;
  isPollingResults: boolean;
}

// Loading messages that will rotate during verification process
const loadingMessages = {
  simple: [
    "Analyzing smart contract structure...",
    "Scanning for common vulnerabilities...",
    "Checking function safety...",
    "Validating state integrity...",
    "Examining access controls...",
  ],
  deep: [
    "Reading intelligently the smart contract...",
    "Generating formal specifications in English...",
    "Analyzing contract invariants...",
    "Identifying potential edge cases...",
    "Preparing mathematical proof framework...",
  ],
  advanced: [
    "Running formal verification proofs...",
    "Applying symbolic execution...",
    "Verifying mathematical assertions...",
    "Building comprehensive security model...",
    "Validating against formal specifications...",
  ]
};

export function VerificationPanel({
  project,
  activeTab = "simple",
  onTabChange,
  onNavigateToLine,
  onStartVerification,
  onCancelLogicValidation,
  onConfirmLogicVerification,
  verificationResult,
  isRunningVerification,
  isLoadingAILogic,
  isPollingResults
}: VerificationPanelProps) {
  const [verificationLevel, setVerificationLevel] = useState<string>(activeTab);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const { toast } = useToast();
<<<<<<< HEAD

=======
  
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

>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
  useEffect(() => {
    // Check backend connection
    const checkBackend = async () => {
      try {
        // Simple check to see if Supabase is accessible
        const { error } = await supabase.from('projects').select('count', { count: 'exact' }).limit(1);
        setBackendConnected(!error);
      } catch (error) {
        setBackendConnected(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
<<<<<<< HEAD
    setVerificationLevel(activeTab);
  }, [activeTab]);
=======
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
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758

  // Effect to handle rotating loading messages
  useEffect(() => {
    if ((isRunningVerification || isPollingResults || isLoadingAILogic) && verificationLevel) {
      const level = verificationLevel as keyof typeof loadingMessages;
      const messages = loadingMessages[level] || loadingMessages.simple;
      
      const intervalId = setInterval(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }, 3000);

      return () => clearInterval(intervalId);
    }
  }, [isRunningVerification, isPollingResults, isLoadingAILogic, verificationLevel]);

  // Get current message based on verification level and index
  useEffect(() => {
    if (verificationLevel && (isRunningVerification || isPollingResults || isLoadingAILogic)) {
      const level = verificationLevel as keyof typeof loadingMessages;
      const messages = loadingMessages[level] || loadingMessages.simple;
      setLoadingMessage(messages[messageIndex]);
    }
  }, [messageIndex, verificationLevel, isRunningVerification, isPollingResults, isLoadingAILogic]);

  const issues = verificationResult?.results || [];
  const isVerifying = isRunningVerification || isPollingResults;
  const isCompleted = verificationResult?.status === VerificationStatus.COMPLETED;
  const isPending = verificationResult?.status === VerificationStatus.PENDING;
  const isAwaitingConfirmation = verificationResult?.status === VerificationStatus.AWAITING_CONFIRMATION;
  const isFailed = verificationResult?.status === VerificationStatus.FAILED;
  
  const handleConfirmLogic = async (logicText: string) => {
    if (onConfirmLogicVerification) {
      await onConfirmLogicVerification(logicText);
    }
  };
  
  const handleVerify = async (level: string) => {
    if (!project) return;
    try {
      await onStartVerification(level);
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive"
      });
<<<<<<< HEAD
=======
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
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
    }
  };

  // Tab state for completed verification views
  const [activeResultTab, setActiveResultTab] = useState<string>("issues");

  const renderVerificationContent = () => {
    // Show backend connection warning
    if (!backendConnected) {
      return (
        <div className="p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Backend Disconnected</AlertTitle>
            <AlertDescription>
              We're having trouble connecting to our backend services. Please check your internet connection and try again.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full mt-2"
          >
            Reload Page
          </Button>
        </div>
      );
    }
    
<<<<<<< HEAD
    // Show loading state
    if (isVerifying || isLoadingAILogic) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background px-2 py-1 rounded-full text-xs font-semibold text-primary border border-primary/20">
              {verificationLevel}
            </div>
=======
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
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
          </div>
          <h3 className="text-xl font-semibold mb-4">Verification in Progress</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4 animate-fade-in transition-all">
            {loadingMessage}
          </p>
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-2">
            <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      );
    }
    
    // Show awaiting confirmation (for deep verification)
    if (isAwaitingConfirmation && verificationResult) {
      return (
        <LogicValidation 
          project_id={project?.id || ''}
          code={project?.code || ''}
          result={verificationResult}
          onConfirmLogic={handleConfirmLogic}
          onCancel={() => onCancelLogicValidation && onCancelLogicValidation()}
          isLoadingAILogic={isLoadingAILogic}
        />
      );
    }
    
    // Show completed verification with results
    if (isCompleted) {
      return (
        <div className="flex flex-col h-full">
          <div className="border-b px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheck className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium">Verification Completed</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setVerificationLevel(activeTab)}
              >
                Rerun Verification
              </Button>
            </div>
          </div>
          
          <Tabs value={activeResultTab} onValueChange={setActiveResultTab} className="flex-1 flex flex-col">
            <div className="px-4 pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="issues" className="flex-1">Issues ({issues.length})</TabsTrigger>
                <TabsTrigger value="logs" className="flex-1">Logs</TabsTrigger>
                <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="issues" className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <VerificationIssuesList 
                    issues={issues} 
                    onNavigateToLine={onNavigateToLine} 
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="logs" className="flex-1 p-4 overflow-auto">
              {verificationResult?.logs && verificationResult.logs.length > 0 ? (
                <div className="space-y-2">
                  {verificationResult.logs.map((log, index) => (
                    <div key={index} className="text-sm border-l-2 border-muted-foreground/20 pl-3 py-1">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No logs available</p>
              )}
            </TabsContent>
            
            <TabsContent value="summary" className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Verification Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    Completed {verificationResult?.completed_at && new Date(verificationResult.completed_at).toLocaleString()}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{issues.length}</div>
                      <div className="text-sm text-muted-foreground">Total Issues</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold capitalize">{verificationLevel}</div>
                      <div className="text-sm text-muted-foreground">Verification Level</div>
                    </CardContent>
                  </Card>
                </div>
                
                {verificationResult?.specs_draft && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Generated CVL Code</h4>
                    <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-40">
                      {verificationResult.specs_draft}
                    </pre>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      );
    }
    
    // Show failed state
    if (isFailed) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Verification Failed</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            We encountered an error while verifying your contract.
            Please try again or contact support if the issue persists.
          </p>
          <Button
            onClick={() => handleVerify(verificationLevel)}
            className="mt-2"
          >
            Retry Verification
          </Button>
        </div>
      );
    }
    
    // Show empty/start state
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Verify Your Contract</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Select a verification level to analyze your smart contract for issues and vulnerabilities.
        </p>
        <div className="space-y-4 w-full max-w-sm">
          <div className="space-y-2">
            <Select 
              value={verificationLevel} 
              onValueChange={setVerificationLevel}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select verification level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple Verification</SelectItem>
                <SelectItem value="deep">Deep Verification</SelectItem>
                <SelectItem value="advanced" disabled>Advanced Verification (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {verificationLevel === "simple" && "Quick analysis to detect common vulnerabilities"}
              {verificationLevel === "deep" && "AI-powered formal verification with logic validation"}
              {verificationLevel === "advanced" && "Advanced formal verification with custom properties"}
            </p>
          </div>
          <Button
            onClick={() => handleVerify(verificationLevel)}
            disabled={!project || !verificationLevel}
            className="w-full"
          >
            Start Verification
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 py-3 border-b bg-card/50">
        <h2 className="text-lg font-semibold">Verification</h2>
        
        {project && (
          <Button 
            variant="outline" 
            size="sm" 
            asChild
          >
            <Link to={`/history/${project.id}`}>
              <History className="h-4 w-4 mr-2" />
              View History
            </Link>
          </Button>
        )}
      </div>

      <div className="flex-1 p-0 overflow-hidden">
        {renderVerificationContent()}
      </div>
    </div>
  );
}
