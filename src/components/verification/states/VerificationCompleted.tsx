
import { VerificationResult, VerificationLevel } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { VerificationIssuesList } from "@/components/verification/VerificationIssuesList";

interface VerificationCompletedProps {
  verificationResult: VerificationResult;
  issues: any[];
  activeResultTab: string;
  setActiveResultTab: (tab: string) => void;
  onStartNewVerification: () => void;
  onNavigateToLine?: (line: number) => void;
}

export function VerificationCompleted({
  verificationResult,
  issues,
  activeResultTab,
  setActiveResultTab,
  onStartNewVerification,
  onNavigateToLine
}: VerificationCompletedProps) {
  // Function to display verification level properly
  const formatVerificationLevel = (level: string | undefined) => {
    if (!level) return "Unknown";
    
    if (level === VerificationLevel.SIMPLE) return "Simple";
    if (level === VerificationLevel.DEEP) return "Deep";
    
    // Capitalize first letter for other types
    return level.charAt(0).toUpperCase() + level.slice(1);
  };
  
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
            onClick={onStartNewVerification}
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
            {formatVerificationLevel(verificationResult.level)}
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
                    {formatVerificationLevel(verificationResult.level)}
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
