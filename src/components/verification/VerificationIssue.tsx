
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationIssue } from "@/types";
import { AlertTriangle, Code, XCircle, ShieldAlert, ArrowRight, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface IssueCardProps {
  issue: VerificationIssue;
  onNavigateToLine?: (line: number) => void;
  defaultOpen?: boolean;
  showInDialog?: boolean;
}

export function IssueCard({ issue, onNavigateToLine, defaultOpen = false, showInDialog = false }: IssueCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleNavigateToLine = () => {
    if (issue.line && onNavigateToLine) {
      onNavigateToLine(issue.line);
    }
  };

  const formatLineNumbers = (lines: number | number[]): string => {
    if (typeof lines === 'number') return `Line ${lines}`;
    return lines.map(line => `Line ${line}`).join(', ');
  };
  
  const getSeverityBadge = (severity: string) => {
    return <Badge variant={severity as any}>{severity}</Badge>;
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-md border bg-card shadow-sm hover:shadow transition-all"
    >
      <CollapsibleTrigger className="w-full text-left p-4 flex items-start gap-3 focus:outline-none">
        <div className="flex-shrink-0 mt-0.5">
          {issue.type === 'error' ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : issue.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-blue-500" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-1 flex-col">
              <h4 className="font-medium truncate max-w-[300px] flex items-center gap-2" title={issue.title}>
                {issue.title}
                <span>{getSeverityBadge(issue.severity)}</span>
              </h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {issue.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {issue.line && !showInDialog && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateToLine();
                  }}
                >
                  {formatLineNumbers(issue.line)}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
              <div className="text-muted-foreground">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 pt-0 ml-8 space-y-4 border-t mt-2">
          {issue.description && (
            <div className="text-sm mt-4">
              <h5 className="text-xs font-medium mb-1 text-muted-foreground">Description:</h5>
              <p className="text-foreground">{issue.description}</p>
            </div>
          )}

          {issue.line && showInDialog && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNavigateToLine}
                className="text-xs"
              >
                {formatLineNumbers(issue.line)}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}

          {issue.suggested_fix && (
            <div>
              <h5 className="text-xs font-medium mb-1 text-muted-foreground flex items-center">
                <span className="mr-2">Suggested fix:</span>
              </h5>
              <pre className="p-3 text-xs bg-muted/50 rounded-md overflow-auto whitespace-pre-wrap border border-border">
                <code className="font-mono">{issue.suggested_fix}</code>
              </pre>
            </div>
          )}

          {issue.code && (
            <div>
              <h5 className="text-xs font-medium mb-1 flex items-center text-muted-foreground">
                <Code className="h-3 w-3 mr-1" />
                <span>Code snippet:</span>
              </h5>
              <pre className="p-3 text-xs bg-muted/50 rounded-md overflow-auto whitespace-pre-wrap border border-border">
                <code className="font-mono">{issue.code}</code>
              </pre>
            </div>
          )}

          {(issue.function_name || issue.contract_name) && (
            <div className="text-xs space-y-1">
              {issue.function_name && (
                <div>
                  <span className="font-medium text-muted-foreground">Function:</span>{" "}
                  <span className="text-foreground">{issue.function_name}</span>
                </div>
              )}
              {issue.contract_name && (
                <div>
                  <span className="font-medium text-muted-foreground">Contract:</span>{" "}
                  <span className="text-foreground">{issue.contract_name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
