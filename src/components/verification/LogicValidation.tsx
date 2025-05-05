
import { VerificationLevel, VerificationResult, VerificationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle, Shield, Maximize2, PenLine } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface LogicValidationProps {
  projectId: string;
  code: string;
  result?: VerificationResult;
  onConfirmLogic: (logicText: string) => void;
  onCancel: () => void;
  isLoadingAILogic: boolean;
}

export function LogicValidation({
  projectId,
  code,
  result,
  onConfirmLogic,
  onCancel,
  isLoadingAILogic
}: LogicValidationProps) {
  const [logicText, setLogicText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Initialize the logic text from spec_draft when result changes
  useEffect(() => {
    if (result?.spec_draft) {
      try {
        const specContent = typeof result.spec_draft === 'string' 
          ? JSON.parse(result.spec_draft) 
          : result.spec_draft;
        
        setLogicText(typeof specContent === 'object' 
          ? JSON.stringify(specContent, null, 2) 
          : specContent);
      } catch (error) {
        // If parsing fails, use the raw content
        setLogicText(typeof result.spec_draft === 'string' 
          ? result.spec_draft 
          : JSON.stringify(result.spec_draft, null, 2));
      }
    }
  }, [result]);
  
  const handleConfirmLogic = () => {
    if (logicText) {
      onConfirmLogic(logicText);
      setIsDialogOpen(false);
      setIsSheetOpen(false);
    }
  };
  
  const handleOpenFullEditor = () => {
    setIsDialogOpen(true);
    // Focus the textarea when the dialog opens
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
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
    <>
      {/* Modern preview card */}
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            Contract Logic
          </CardTitle>
          <CardDescription>
            Review and edit the generated verification logic
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          {/* Canvas-like preview with partial text - smaller size and grey background */}
          <div 
            onClick={handleOpenFullEditor}
            className="h-full w-full p-6 cursor-pointer group relative"
          >
            <div className="bg-gray-100 dark:bg-zinc-900 rounded-lg h-48 overflow-hidden relative border border-border">
              {/* Actual content with fade overlay */}
              <div className="p-4 h-full overflow-hidden">
                <pre className="text-sm font-mono h-full overflow-hidden whitespace-pre-wrap">
                  {logicText}
                </pre>
                
                {/* Overlay with fade */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 dark:to-black/80 pointer-events-none" />
                
                {/* Edit indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-black/60 dark:bg-white/20 backdrop-blur-sm p-4 rounded-lg shadow-xl">
                    <PenLine className="h-8 w-8 text-white dark:text-white mb-2 mx-auto" />
                    <p className="text-white dark:text-white font-medium">Click to Edit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
      
      {/* Modern full-screen dialog for editing */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Edit Verification Logic
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <Textarea 
              ref={textareaRef}
              className="h-full w-full font-mono text-sm p-6 resize-none focus-visible:ring-0 focus-visible:outline-none border-none rounded-none"
              value={logicText}
              onChange={(e) => setLogicText(e.target.value)}
              spellCheck={false}
            />
          </div>
          
          <DialogFooter className="p-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}