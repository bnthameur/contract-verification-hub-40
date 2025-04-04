
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationIssue } from "@/types";
import { AlertTriangle, Code, XCircle, ShieldAlert, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface IssueCardProps {
  issue: VerificationIssue;
  onNavigateToLine?: (line: number) => void;
}

export function IssueCard({ issue, onNavigateToLine }: IssueCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleNavigateToLine = () => {
    if (issue.location?.line && onNavigateToLine) {
      onNavigateToLine(issue.location.line);
    }
  };
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-md border bg-card"
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          {issue.type === 'error' ? (
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          ) : issue.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          )}
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center gap-2">
                <h4 className="font-medium">
                  {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                </h4>
                <Badge variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'outline'}>
                  {issue.severity}
                </Badge>
              </div>
              
              {issue.location?.line && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs" 
                  onClick={handleNavigateToLine}
                >
                  Line {issue.location.line}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">{issue.message}</p>
            
            {(issue.code || issue.suggested_fix) && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2 px-0 h-6 text-xs">
                  {isOpen ? "Show less" : "Show more"}
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
        </div>
      </div>
      
      <CollapsibleContent>
        <div className="px-3 pb-3 pt-0">
          {issue.suggested_fix && (
            <div className="mt-2">
              <h5 className="text-xs font-medium mb-1">Suggested fix:</h5>
              <p className="text-xs text-muted-foreground">{issue.suggested_fix}</p>
            </div>
          )}
          
          {issue.code && (
            <div className="mt-2">
              <h5 className="text-xs font-medium mb-1 flex items-center">
                <Code className="h-3 w-3 mr-1" />
                Code snippet:
              </h5>
              <pre className="p-2 text-xs bg-muted rounded-md overflow-auto whitespace-pre">
                <code>{issue.code}</code>
              </pre>
            </div>
          )}
          
          {issue.function_name && (
            <div className="mt-2 text-xs">
              <span className="font-medium">Function:</span>{" "}
              <span className="text-muted-foreground">{issue.function_name}</span>
            </div>
          )}
          
          {issue.contract_name && (
            <div className="mt-1 text-xs">
              <span className="font-medium">Contract:</span>{" "}
              <span className="text-muted-foreground">{issue.contract_name}</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
