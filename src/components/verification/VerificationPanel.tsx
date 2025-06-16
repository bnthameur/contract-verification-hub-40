
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationIssuesList } from "@/components/verification/VerificationIssuesList";
import { Button } from "@/components/ui/button";
import { Project, VerificationResult, VerificationStatus, VerificationLevel } from "@/types";
import { useState, useEffect, useMemo } from "react";
import { LogicValidation } from "@/components/verification/LogicValidation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, ShieldCheck, History, ChevronDown, AlertCircle, RefreshCw, Ban } from "lucide-react";
import { Link } from "react-router-dom";

// Import the various components for different verification states
import { VerificationLoading } from "./states/VerificationLoading";
import { VerificationCompleted } from "./states/VerificationCompleted";
import { VerificationEmpty } from "./states/VerificationEmpty";
import { VerificationFailed } from "./states/VerificationFailed";
import { VerificationFormNew } from "./states/VerificationFormNew";
import { VerificationConnectionError } from "./states/VerificationConnectionError";

interface VerificationPanelProps {
  project?: Project;
  onNavigateToLine?: (line: number) => void;
  onStartVerification: (level: string) => Promise<void>;
  onCancelLogicValidation?: () => void;
  onConfirmLogicVerification?: (logicText: string) => Promise<void>;
  onCancelVerification?: (verificationId: string) => Promise<void>;
  verificationResult?: VerificationResult;
  isRunningVerification: boolean;
  isLoadingAILogic: boolean;
  isPollingResults: boolean;
}

export function VerificationPanel({
  project,
  onNavigateToLine,
  onStartVerification,
  onCancelLogicValidation,
  onConfirmLogicVerification,
  onCancelVerification,
  verificationResult,
  isRunningVerification,
  isLoadingAILogic,
  isPollingResults
}: VerificationPanelProps) {
  const [verificationLevel, setVerificationLevel] = useState<string>("simple");
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [showNewVerification, setShowNewVerification] = useState<boolean>(false);
  const { toast } = useToast();

  console.log("VerificationPanel state:", {
    verificationResult: !!verificationResult,
    status: verificationResult?.status,
    hasSpecDraft: !!verificationResult?.spec_draft,
    hasResults: !!(verificationResult?.results && verificationResult.results.length > 0),
    isRunningVerification,
    isLoadingAILogic,
    isPollingResults,
    showNewVerification,
    backendConnected
  });

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          console.error("API URL not configured in environment variables");
          setBackendConnected(false);
          return;
        }
        
        const response = await fetch(`${apiUrl}/ping`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          mode: 'cors'
        });
        
        if (!response.ok) {
          console.error("Backend API not accessible:", await response.text());
          setBackendConnected(false);
          return;
        }
        
        const data = await response.json();
        if (!data || data.status !== "ok") {
          console.error("Backend API returned unexpected response:", data);
          setBackendConnected(false);
          return;
        }
        
        console.log("Backend connection successful:", data);
        setBackendConnected(true);
      } catch (error) {
        console.error("Error checking backend connection:", error);
        setBackendConnected(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const issues = verificationResult?.results || [];

  const handleConfirmLogic = async (logicText: string) => {
    if (onConfirmLogicVerification) {
      await onConfirmLogicVerification(logicText);
    }
  };
  
  const handleVerify = async (level: string) => {
    if (!project) return;
    try {
      console.log("Starting verification with level:", level);
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

  const handleCancelVerification = async () => {
    if (!verificationResult || !onCancelVerification) return;
    
    try {
      await onCancelVerification(verificationResult.id);
      toast({
        title: "Verification cancelled",
        description: "The verification process has been stopped.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel verification process.",
        variant: "destructive"
      });
    }
  };

  const handleStartNewVerification = () => {
    console.log("Start New Verification button clicked");
    setShowNewVerification(true);
  };

  const handleCancelNewVerification = () => {
    console.log("Cancel New Verification");
    setShowNewVerification(false);
  };

  const [activeResultTab, setActiveResultTab] = useState<string>("issues");

  // Memoize the content to prevent unnecessary re-renders
  const verificationContent = useMemo(() => {
    console.log("Computing verification content:", {
      backendConnected,
      showNewVerification,
      verificationStatus: verificationResult?.status,
      hasSpecDraft: !!verificationResult?.spec_draft,
      hasResults: !!(verificationResult?.results && verificationResult.results.length > 0),
      isActivelyRunning: isRunningVerification
    });

    // Backend connection check
    if (!backendConnected) {
      return (
        <VerificationConnectionError 
          apiUrl={import.meta.env.VITE_API_URL} 
          onRetry={() => window.location.reload()} 
        />
      );
    }
    
    // Show new verification form if requested
    if (showNewVerification) {
      console.log("Showing new verification form");
      return (
        <VerificationFormNew
          verificationLevel={verificationLevel}
          onVerificationLevelChange={setVerificationLevel}
          onCancel={handleCancelNewVerification}
          onVerify={handleVerify}
          isDisabled={!project || !verificationLevel}
        />
      );
    }
    
    // Show loading when verification is running
    if (isRunningVerification && verificationResult?.status === VerificationStatus.RUNNING) {
      console.log("Showing loading state");
      return (
        <VerificationLoading
          verificationLevel={verificationLevel}
          onCancel={handleCancelVerification}
        />
      );
    }
    
    // Show logic validation when spec_draft is available
    if (verificationResult?.spec_draft && 
        verificationResult.status === VerificationStatus.AWAITING_CONFIRMATION) {
      console.log("Showing logic validation");
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
    if (verificationResult?.status === VerificationStatus.COMPLETED && 
        verificationResult.results && verificationResult.results.length > 0) {
      console.log("Showing completed verification results");
      return (
        <VerificationCompleted 
          verificationResult={verificationResult}
          issues={issues}
          activeResultTab={activeResultTab}
          setActiveResultTab={setActiveResultTab}
          onStartNewVerification={handleStartNewVerification}
          onNavigateToLine={onNavigateToLine}
        />
      );
    }
    
    // Show failed state
    if (verificationResult?.status === VerificationStatus.FAILED) {
      console.log("Showing failed state");
      return (
        <VerificationFailed 
          onRetry={handleStartNewVerification}
          errorMessage={verificationResult?.error_message}
        />
      );
    }
    
    // Show empty state for projects without verification history
    if (!verificationResult) {
      console.log("Showing empty state (no verification history)");
      return (
        <VerificationEmpty 
          verificationLevel={verificationLevel}
          onVerificationLevelChange={setVerificationLevel}
          onVerify={handleVerify}
          isDisabled={!project || !verificationLevel}
        />
      );
    }
    
    // Show latest verification results if available
    if (verificationResult && verificationResult.results && verificationResult.results.length > 0) {
      console.log("Showing latest verification results");
      return (
        <VerificationCompleted 
          verificationResult={verificationResult}
          issues={issues}
          activeResultTab={activeResultTab}
          setActiveResultTab={setActiveResultTab}
          onStartNewVerification={handleStartNewVerification}
          onNavigateToLine={onNavigateToLine}
        />
      );
    }
    
    // Fallback: Show start new verification button
    console.log("Showing fallback start new verification button");
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Ready to Verify</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Start a new verification to analyze your smart contract.
        </p>
        <Button
          onClick={handleStartNewVerification}
          className="gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          Start New Verification
        </Button>
      </div>
    );
  }, [
    backendConnected,
    showNewVerification,
    verificationResult?.status,
    verificationResult?.spec_draft,
    verificationResult?.results,
    verificationResult?.error_message,
    verificationResult?.id,
    isRunningVerification,
    isLoadingAILogic,
    verificationLevel,
    project,
    issues,
    activeResultTab,
    handleStartNewVerification,
    handleCancelNewVerification,
    handleVerify,
    handleCancelVerification,
    handleConfirmLogic,
    onNavigateToLine,
    onCancelLogicValidation
  ]);

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
        {verificationContent}
      </div>
    </div>
  );
}
