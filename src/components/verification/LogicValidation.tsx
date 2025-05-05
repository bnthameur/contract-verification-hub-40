import { VerificationLevel, VerificationResult, VerificationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Shield } from "lucide-react";

interface LogicValidationProps {
  project_id: string;
  code: string;
  result?: VerificationResult;
  onConfirmLogic: (logicText: string) => void;
  onCancel: () => void;
  isLoadingAILogic: boolean;
}

export function LogicValidation({
  project_id,
  code,
  result,
  onConfirmLogic,
  onCancel,
  isLoadingAILogic
}: LogicValidationProps) {
  const [logicText, setLogicText] = useState("");
  
  // Initialize the logic text when result changes
  useEffect(() => {
    if (result && result.spec_draft) {
      setLogicText(result.spec_draft);
    }
  }, [result]);
  
  const handleConfirmLogic = () => {
    if (logicText) {
      onConfirmLogic(logicText);
    }
  };
  
  const isGenerating = isLoadingAILogic || (result?.status === VerificationStatus.PENDING);
  const isConfirming = result?.status === VerificationStatus.AWAITING_CONFIRMATION;
  const isRunning = result?.status === VerificationStatus.RUNNING;
  
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-medium mb-2">Generating Logic...</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Our AI is analyzing your smart contract to generate formal verification logic.
          This may take a moment.
        </p>
      </div>
    );
  }
  
  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-medium mb-2">Verification In Progress</h3>
        <p className="text-muted-foreground text-center max-w-md">
          The formal verification is now running with your confirmed logic.
          You can view progress in the Verification tab.
        </p>
      </div>
    );
  }
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Contract Logic Validation
        </CardTitle>
        <CardDescription>
          Review and edit the AI-generated contract logic before verification
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <Textarea 
          className="h-full font-mono text-sm"
          placeholder="AI will generate formal verification logic for your contract..."
          value={logicText}
          onChange={(e) => setLogicText(e.target.value)}
        />
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button 
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        <Button 
          onClick={handleConfirmLogic} 
          disabled={!logicText}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Confirm Logic
        </Button>
      </CardFooter>
    </Card>
  );
}