import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VerificationResult, VerificationStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface LogicValidationProps {
  projectId: string;
  code: string;
  result?: VerificationResult;
  onConfirmLogic: (logicText: string) => Promise<void>;
  onCancel: () => void;
  isLoadingAILogic?: boolean;
  onLogicConfirmed?: () => void;
}

const EXAMPLE_SNIPPETS = [
  {
    title: "General Safety",
    snippet: "- No reentrancy vulnerabilities\n- No integer overflows\n- No unauthorized access to functions"
  },
  {
    title: "ERC20 Properties",
    snippet: "- Total supply equals sum of all balances\n- Transfer preserves total supply\n- No transfers to zero address"
  },
  {
    title: "Access Control",
    snippet: "- Only owner can mint new tokens\n- Only authorized addresses can call admin functions\n- Pausing mechanism works correctly"
  },
  {
    title: "Custom Business Logic",
    snippet: "- Staking rewards are calculated correctly\n- Fees are collected as specified\n- Time locks function properly"
  }
];

export function LogicValidation({
  projectId,
  code,
  result,
  onConfirmLogic,
  onCancel,
  isLoadingAILogic = false,
  onLogicConfirmed,
}: LogicValidationProps) {
  const [logicText, setLogicText] = useState(result?.logic_text || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (result?.logic_text) {
      setLogicText(result.logic_text);
    }
  }, [result?.logic_text]);

  const handleConfirm = async () => {
    if (!logicText.trim()) {
      toast({
        title: "Validation required",
        description: "Please provide at least one property to verify",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmLogic(logicText);
      if (onLogicConfirmed) onLogicConfirmed();
      toast({
        title: "Logic confirmed",
        description: "Your logic validation has been submitted for verification",
      });
    } catch (error: any) {
      toast({
        title: "Error confirming logic",
        description: error.message || "An error occurred during logic confirmation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addExampleSnippet = (snippet: string) => {
    setLogicText(prev => prev ? `${prev}\n\n${snippet}` : snippet);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Contract Logic Validation</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Validate the AI-generated logic description and specify properties you want to verify.</p>
                <p className="mt-2">Edit the text to add, modify, or remove properties before confirming.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Review and edit the contract logic for formal verification
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoadingAILogic ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-center">Analyzing contract and generating logic description...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
          </div>
        ) : (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Guidance</AlertTitle>
              <AlertDescription>
                Edit the AI-generated description below to specify exactly what properties you want
                to verify in your contract. Be specific and clear about constraints and expected behavior.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-2 my-4">
              <p className="text-sm font-medium w-full mb-1">Example snippets:</p>
              {EXAMPLE_SNIPPETS.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => addExampleSnippet(example.snippet)}
                  className="text-xs"
                >
                  + {example.title}
                </Button>
              ))}
            </div>

            <Textarea
              value={logicText}
              onChange={(e) => setLogicText(e.target.value)}
              placeholder="Enter or review the contract logic and properties to be verified..."
              className="min-h-[250px] font-mono text-sm"
              disabled={isSubmitting}
            />

            {result?.status === VerificationStatus.RUNNING && (
              <Alert variant="default" className="bg-primary/10 text-primary border-primary/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verification In Progress</AlertTitle>
                <AlertDescription>
                  The verification is currently running with the provided logic.
                </AlertDescription>
              </Alert>
            )}

            {result?.status === VerificationStatus.COMPLETED && (
              <Alert variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Verification Complete</AlertTitle>
                <AlertDescription>
                  The verification has completed. Please check the results tab for details.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting || isLoadingAILogic}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={isSubmitting || isLoadingAILogic || !logicText.trim()}
        >
          {isSubmitting ? "Submitting..." : "Confirm Logic"}
        </Button>
      </CardFooter>
    </Card>
  );
}
