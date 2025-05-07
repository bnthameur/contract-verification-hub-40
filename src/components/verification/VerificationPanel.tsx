import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationIssuesList } from "@/components/verification/VerificationIssuesList";
import { Button } from "@/components/ui/button";
import { Project, VerificationResult, VerificationStatus, VerificationLevel } from "@/types";
import { useState, useEffect } from "react";
import { LogicValidation } from "@/components/verification/LogicValidation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, ShieldCheck, History, ChevronDown, AlertCircle, RefreshCw } from "lucide-react";
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
  const [showNewVerification, setShowNewVerification] = useState<boolean>(false);
  const { toast } = useToast();
  
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
    setVerificationLevel(activeTab);
  }, [activeTab]);

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
      setShowNewVerification(false);
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive"
      });
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
    
    // Show loading state
    if (isVerifying || isLoadingAILogic) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background px-2 py-1 rounded-full text-xs font-semibold text-primary border border-primary/20">
              {verificationLevel}
            </div>
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
    
    // Show new verification form if button was clicked
    if (showNewVerification) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Start New Verification</h3>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewVerification(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleVerify(verificationLevel)}
                disabled={!project || !verificationLevel}
                className="flex-1"
              >
                Start Verification
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Show completed verification with results
    if (isCompleted && verificationResult) {
      return (
        <div className="flex flex-col h-full">
          <div className="border-b px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheck className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium">Verification Results</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowNewVerification(true)}
                className="gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                New Verification
              </Button>
            </div>
          </div>
          
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Level:</span>
              <span className="text-sm capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {verificationResult.level}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {verificationResult.completed_at && new Date(verificationResult.completed_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Issues found:</span>
              <span className="text-sm font-semibold">{issues.length}</span>
            </div>
          </div>
          
          <Separator />
          
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
                      <div className="text-2xl font-bold capitalize">
                        {verificationResult.level === VerificationLevel.SIMPLE ? "Simple" : 
                         verificationResult.level === VerificationLevel.DEEP ? "Deep" : 
                         verificationResult.level}
                      </div>
                      <div className="text-sm text-muted-foreground">Verification Level</div>
                    </CardContent>
                  </Card>
                </div>
                
                {verificationResult?.cvl_code ? (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Generated CVL Code</h4>
                    <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-40">
                      {verificationResult.cvl_code}
                    </pre>
                  </div>
                ) : verificationResult?.spec_draft && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Generated Logic Specification</h4>
                    <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-40">
                      {verificationResult.spec_draft}
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
            onClick={() => setShowNewVerification(true)}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      );
    }
    
    // Show empty state for projects without verification history
    if (!verificationResult) {
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
    }
    
    // Default return for any other state
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Button
          onClick={() => setShowNewVerification(true)}
          className="gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          Start New Verification
        </Button>
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
