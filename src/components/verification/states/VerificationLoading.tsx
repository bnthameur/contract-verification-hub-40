
import { Loader2, Ban } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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

interface VerificationLoadingProps {
  verificationLevel: string;
  onCancel?: () => void;
}

export function VerificationLoading({ verificationLevel, onCancel }: VerificationLoadingProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [loadingDuration, setLoadingDuration] = useState(0);
  
  // Add debug logging to understand when this component is being rendered
  useEffect(() => {
    console.log("🔄 VerificationLoading component mounted/updated:", {
      verificationLevel,
      timestamp: new Date().toISOString()
    });
    
    // Track loading duration
    const startTime = Date.now();
    const durationInterval = setInterval(() => {
      setLoadingDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => {
      console.log("🔄 VerificationLoading component unmounted");
      clearInterval(durationInterval);
    };
  }, [verificationLevel]);
  
  // Effect to handle rotating loading messages
  useEffect(() => {
    if (verificationLevel) {
      const level = verificationLevel as keyof typeof loadingMessages;
      const messages = loadingMessages[level] || loadingMessages.simple;
      
      const intervalId = setInterval(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }, 3000);

      return () => clearInterval(intervalId);
    }
  }, [verificationLevel]);

  // Get current message based on verification level and index
  useEffect(() => {
    if (verificationLevel) {
      const level = verificationLevel as keyof typeof loadingMessages;
      const messages = loadingMessages[level] || loadingMessages.simple;
      setLoadingMessage(messages[messageIndex]);
    }
  }, [messageIndex, verificationLevel]);

  const handleCancel = async () => {
    if (!onCancel) return;
    
    console.log("🛑 Cancelling verification from loading component");
    setIsCancelling(true);
    await onCancel();
    setIsCancelling(false);
  };

  // Auto-cancel if loading takes too long (safety mechanism)
  useEffect(() => {
    if (loadingDuration > 120) { // 2 minutes
      console.warn("⚠️ Verification loading for over 2 minutes, something might be wrong");
    }
  }, [loadingDuration]);

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
      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-2 mb-6">
        <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }}></div>
      </div>
      
      <div className="text-xs text-muted-foreground mb-4">
        Loading for {loadingDuration}s
      </div>
      
      <Button 
        variant="destructive" 
        size="sm"
        disabled={isCancelling}
        onClick={handleCancel}
        className="flex items-center gap-1.5"
      >
        <Ban className="h-4 w-4" />
        {isCancelling ? "Stopping..." : "Stop Verification"}
      </Button>
    </div>
  );
}
