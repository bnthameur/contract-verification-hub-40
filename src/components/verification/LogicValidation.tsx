
import { VerificationLevel, VerificationResult, VerificationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle, Shield, Edit2, X } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

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
  const [isEditing, setIsEditing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
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

  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    setShowOverlay(false);
  }, []);
  
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
    <Card className={`h-full flex flex-col border-0 ${isDark ? 'bg-background' : 'bg-background'}`}>
      <CardHeader className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Contract Logic
        </CardTitle>
        <CardDescription>
          Review and edit the generated verification logic
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 relative p-0">
        <div className="relative h-full w-full">
          <Textarea 
            className={`h-full font-mono text-sm border-0 p-4 resize-none ${isDark ? 'bg-background text-foreground' : 'bg-background text-foreground'} ${isEditing ? '' : 'pointer-events-none'}`}
            placeholder="AI will generate formal verification logic for your contract..."
            value={logicText}
            onChange={(e) => setLogicText(e.target.value)}
          />
          
          {showOverlay && !isEditing && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
              <div 
                className={`${isDark ? 'bg-card/30' : 'bg-card/30'} backdrop-blur-lg rounded-lg p-6 cursor-pointer hover:bg-opacity-40 transition-all border border-primary/20`}
                onClick={handleEditClick}
              >
                <Edit2 className="h-8 w-8 mx-auto mb-3 text-primary opacity-80" />
                <p className="text-foreground text-lg font-medium">Click to Edit</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className={`flex justify-between p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} bg-card/50`}>
        <Button 
          variant="ghost"
          onClick={onCancel}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        
        {isEditing && (
          <Button 
            onClick={handleConfirmLogic} 
            disabled={!logicText}
            className="bg-primary hover:bg-primary/90"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirm Logic
          </Button>
        )}
        
        {!isEditing && (
          <Button 
            onClick={handleEditClick} 
            variant="outline"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Logic
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
