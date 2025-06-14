
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationIssuesList } from "@/components/verification/VerificationIssuesList";
import { Button } from "@/components/ui/button";
import { Project, VerificationResult, VerificationStatus, VerificationLevel } from "@/types";
import { useState, useEffect } from "react";
import { LogicValidation } from "@/components/verification/LogicValidation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, ShieldCheck, History, ChevronDown, AlertCircle, RefreshCw, Ban } from "lucide-react";
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// Import the various components we'll create for the different verification states
import { VerificationLoading } from "./states/VerificationLoading";
import { VerificationCompleted } from "./states/VerificationCompleted";
import { VerificationEmpty } from "./states/VerificationEmpty";
import { VerificationFailed } from "./states/VerificationFailed";
import { VerificationFormNew } from "./states/VerificationFormNew";
import { VerificationConnectionError } from "./states/VerificationConnectionError";

interface VerificationPanelProps {
  project?: Project;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
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
  activeTab = "simple",
  onTabChange,
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
  const [verificationLevel, setVerificationLevel] = useState<string>(activeTab);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [showNewVerification, setShowNewVerification] = useState<boolean>(false);
  const { toast } = useToast();

  // SIMPLIFIED STATE LOGIC - No more complex polling or force refresh
  console.log("VerificationPanel SIMPLIFIED state:", {
    verificationResult: !!verificationResult,
    status: verificationResult?.status,
    hasSpecDraft: !!verificationResult?.spec_draft,
    hasResults: !!(verificationResult?.results && verificationResult.results.length > 0),
    isPollingResults,
    isRunningVerification,
    isLoadingAILogic,
    showNewVerification,
    backendConnected
  });

  useEffect(() => {
    // Check backend connection
    const checkBackend = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          console.error("API URL not configured in environment variables");
          setBackendConnected(false);
          return;
        }
        
        // First check if Supabase is accessible as a basic connectivity test
        const { error } = await supabase.from('projects').select('count', { count: 'exact' }).limit(1);
        
        // Now check if the API backend is accessible using the correct endpoint
        try {
          console.log("Checking backend connection at:", apiUrl);
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
          
          try {
            const data = await response.json();
            
            // Validate the response has the expected format
            if (!data || data.status !== "ok") {
              console.error("Backend API returned unexpected response:", data);
              setBackendConnected(false);
              return;
            }
            
            // If both checks pass, backend is connected
            console.log("Backend connection successful:", data);
            setBackendConnected(!error);
          } catch (jsonError) {
            console.error("Error parsing JSON response:", jsonError);
            setBackendConnected(false);
          }
        } catch (apiError) {
          console.error("Error connecting to API backend:", apiError);
          setBackendConnected(false);
        }
      } catch (error) {
        console.error("Error checking backend connection:", error);
        setBackendConnected(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setVerificationLevel(activeTab);
  }, [activeTab]);

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
    console.log("Start New Verification button clicked - SIMPLIFIED");
    setShowNewVerification(true);
  };

  const handleCancelNewVerification = () => {
    console.log("Cancel New Verification - SIMPLIFIED");
    setShowNewVerification(false);
  };

  // Tab state for completed verification views
  const [activeResultTab, setActiveResultTab] = useState<string>("issues");

  const renderVerificationContent = () => {
    console.log("SIMPLIFIED rendering logic:", {
      backendConnected,
      showNewVerification,
      verificationStatus: verificationResult?.status,
      hasSpecDraft: !!verificationResult?.spec_draft,
      hasResults: !!(verificationResult?.results && verificationResult.results.length > 0),
      isActivelyRunning: isRunningVerification || isLoadingAILogic || isPollingResults
    });

    // PRIORITY 1: Backend connection check
    if (!backendConnected) {
      return (
        <VerificationConnectionError 
          apiUrl={import.meta.env.VITE_API_URL} 
          onRetry={() => window.location.reload()} 
        />
      );
    }
    
    // PRIORITY 2: Show new verification form if requested
    if (showNewVerification) {
      console.log("✅ SIMPLIFIED: Showing new verification form");
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
    
    // PRIORITY 3: Show loading ONLY when actively running AND no results/spec_draft yet
    if ((isRunningVerification || isLoadingAILogic || isPollingResults) && 
        (!verificationResult || 
         (verificationResult.status === VerificationStatus.PENDING || 
          verificationResult.status === VerificationStatus.RUNNING)) &&
        !verificationResult?.spec_draft && 
        (!verificationResult?.results || verificationResult.results.length === 0)) {
      console.log("✅ SIMPLIFIED: Showing loading state");
      return (
        <VerificationLoading
          verificationLevel={verificationLevel}
          onCancel={handleCancelVerification}
        />
      );
    }
    
    // PRIORITY 4: Show logic validation when spec_draft is available
    if (verificationResult?.spec_draft && 
        verificationResult.status === VerificationStatus.AWAITING_CONFIRMATION) {
      console.log("✅ SIMPLIFIED: Showing logic validation");
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
    
    // PRIORITY 5: Show completed verification with results
    if (verificationResult?.status === VerificationStatus.COMPLETED && 
        verificationResult.results && verificationResult.results.length > 0) {
      console.log("✅ SIMPLIFIED: Showing completed verification results");
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
    
    // PRIORITY 6: Show failed state
    if (verificationResult?.status === VerificationStatus.FAILED) {
      console.log("✅ SIMPLIFIED: Showing failed state");
      return (
        <VerificationFailed 
          onRetry={handleStartNewVerification}
          errorMessage={verificationResult?.error_message}
        />
      );
    }
    
    // PRIORITY 7: Show empty state for projects without verification history OR show latest results
    if (!verificationResult) {
      console.log("✅ SIMPLIFIED: Showing empty state (no verification history)");
      return (
        <VerificationEmpty 
          verificationLevel={verificationLevel}
          onVerificationLevelChange={setVerificationLevel}
          onVerify={handleVerify}
          isDisabled={!project || !verificationLevel}
        />
      );
    }
    
    // PRIORITY 8: Show latest verification results if available
    if (verificationResult && verificationResult.results && verificationResult.results.length > 0) {
      console.log("✅ SIMPLIFIED: Showing latest verification results");
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
    
    // FALLBACK: Show start new verification button
    console.log("⚠️ SIMPLIFIED: Showing fallback start new verification button");
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
