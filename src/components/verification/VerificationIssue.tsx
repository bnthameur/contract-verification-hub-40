<<<<<<< HEAD
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  ChevronDown,
  MessageSquare
} from "lucide-react";
import { VerificationIssue as VerificationIssueType } from "@/types";
=======

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationIssue } from "@/types";
import { AlertTriangle, Code, XCircle, ShieldAlert, ArrowRight, Eye } from "lucide-react";
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";

interface VerificationIssueProps {
  issue: VerificationIssueType;
  onNavigateToLine?: (line: number) => void;
  defaultOpen?: boolean;
  showInDialog?: boolean;
}

<<<<<<< HEAD
export function VerificationIssue({ issue, onNavigateToLine, defaultOpen = false, showInDialog = false }: VerificationIssueProps) {
  const [open, setOpen] = useState(defaultOpen);
  
=======
export function IssueCard({ issue, onNavigateToLine, defaultOpen = false, showInDialog = false }: IssueCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
  const handleNavigateToLine = () => {
    if (onNavigateToLine && typeof issue.line === 'number') {
      onNavigateToLine(issue.line);
    }
  };

<<<<<<< HEAD
  const getIssueIcon = () => {
    switch (issue.type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const getSeverityColor = () => {
    switch (issue.severity) {
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-muted-foreground/20";
    }
=======
  const formatLineNumbers = (lines: number | number[]): string => {
    if (typeof lines === 'number') return `Line ${lines}`;
    return lines.map(line => `Line ${line}`).join(', ');
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border rounded-lg overflow-hidden mb-3"
    >
<<<<<<< HEAD
      <CollapsibleTrigger asChild>
        <div 
          className={cn(
            "flex items-start p-3 gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
=======
      <div className="p-3">
        <div className="flex items-start gap-2">
          {issue.type === 'error' ? (
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          ) : issue.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
          )}
        >
          <div className="mt-0.5">
            {getIssueIcon()}
          </div>
          <div className="flex-1">
<<<<<<< HEAD
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{issue.title}</h3>
              {typeof issue.line === 'number' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateToLine();
                  }}
                >
                  Line {issue.line}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {issue.description}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className={cn(
              "text-xs px-2 py-0.5 rounded-full border", 
              getSeverityColor()
            )}>
              {issue.severity}
            </div>
            <div className="text-muted-foreground">
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
=======
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-1 items-center gap-2">
                <h4 className="font-medium truncate max-w-[300px]" title={issue.title}>
                  {issue.title}
                </h4>
                <Badge variant={
                  issue.severity === 'critical' ? 'destructive' : 
                  issue.severity === 'high' ? 'destructive' :
                  issue.severity === 'medium' ? 'default' : 'outline'
                }>
                  {issue.severity}
                </Badge>
              </div>

              {!showInDialog && (
                <div className="flex items-center gap-2">
                  {issue.line && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs" 
                      onClick={handleNavigateToLine}
                    >
                      {formatLineNumbers(issue.line)}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {(issue.code || issue.suggested_fix || issue.function_name || issue.contract_name || issue.description) && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2 px-0 h-6 text-xs">
                  {isOpen ? "Show less" : "Show details"}
                </Button>
              </CollapsibleTrigger>
            )}
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
<<<<<<< HEAD
        <div className="p-4 pt-0 border-t bg-muted/30">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium mb-1">Description</h4>
              <p className="text-sm">{issue.description}</p>
            </div>
            
            {issue.function_name && (
              <div>
                <h4 className="text-xs font-medium mb-1">Function</h4>
                <p className="text-sm">{issue.function_name}</p>
              </div>
            )}
            
            {issue.suggested_fix && (
              <div>
                <h4 className="text-xs font-medium mb-1">Suggested Fix</h4>
                <p className="text-sm">{issue.suggested_fix}</p>
              </div>
            )}
            
            {issue.code && (
              <div>
                <h4 className="text-xs font-medium mb-1">Code</h4>
                <pre className="text-xs p-2 bg-background rounded border whitespace-pre-wrap overflow-x-auto">
                  {issue.code}
                </pre>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2">
              <div className="text-xs flex items-center gap-1.5">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-medium">{issue.confidence}</span>
              </div>
              
              {typeof issue.line === 'number' && (
                <Button 
                  variant="outline"
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={handleNavigateToLine}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Go to line {issue.line}
                </Button>
              )}
            </div>
=======
        <div className="px-3 pb-3 pt-0">
          <div className="space-y-4">
            {issue.description && (
              <div className="text-sm text-muted-foreground">
                {issue.description}
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
                <h5 className="text-xs font-medium mb-1">Suggested fix:</h5>
                <pre className="p-2 text-xs bg-muted rounded-md overflow-auto whitespace-pre-wrap">
                  <code className="font-mono">{issue.suggested_fix}</code>
                </pre>
              </div>
            )}

            {issue.code && (
              <div>
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
              <div className="text-xs space-y-1">
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
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
<<<<<<< HEAD

// Explicitly export VerificationIssue as IssueCard for backward compatibility
export { VerificationIssue as IssueCard };
=======
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
