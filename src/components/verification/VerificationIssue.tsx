
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

// IssueCard.tsx
export function IssueCard({ issue, onNavigateToLine }: IssueCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigateToLine = () => {
    if (issue.line && onNavigateToLine) {
      onNavigateToLine(issue.line);
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
          {/* Icon mapping remains the same */}
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
                  {issue.title}
                </h4>
                <Badge variant={
                  issue.severity === 'critical' ? 'destructive' : 
                  issue.severity === 'high' ? 'destructive' :
                  issue.severity === 'medium' ? 'default' : 'outline'
                }>
                  {issue.severity}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  Confidence: {issue.confidence?.toLowerCase() || 'unknown'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {issue.file}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs" 
                  onClick={handleNavigateToLine}
                >
                  Line {issue.line}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              {issue.description}
            </p>

            {(issue.code || issue.suggested_fix || issue.function_name || issue.contract_name) && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2 px-0 h-6 text-xs">
                  {isOpen ? "Show less" : "Show details"}
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
              <pre className="p-2 text-xs bg-muted rounded-md overflow-auto whitespace-pre-wrap">
                <code className="font-mono">{issue.suggested_fix}</code>
              </pre>
            </div>
          )}

          {issue.code && (
            <div className="mt-2">
              <h5 className="text-xs font-medium mb-1 flex items-center">
                <Code className="h-3 w-3 mr-1" />
                Code snippet:
              </h5>
              <pre className="p-2 text-xs bg-muted rounded-md overflow-auto whitespace-pre-wrap">
                <code className="font-mono">{issue.code}</code>
              </pre>
            </div>
          )}

          {(issue.function_name || issue.contract_name) && (
            <div className="mt-2 text-xs space-y-1">
              {issue.function_name && (
                <div>
                  <span className="font-medium">Function:</span>{" "}
                  <span className="text-muted-foreground">{issue.function_name}</span>
                </div>
              )}
              {issue.contract_name && (
                <div>
                  <span className="font-medium">Contract:</span>{" "}
                  <span className="text-muted-foreground">{issue.contract_name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}