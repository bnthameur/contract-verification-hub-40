import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  ChevronDown,
  MessageSquare
} from "lucide-react";
import { VerificationIssue as VerificationIssueType } from "@/types";
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

export function VerificationIssue({ issue, onNavigateToLine, defaultOpen = false, showInDialog = false }: VerificationIssueProps) {
  const [open, setOpen] = useState(defaultOpen);
  
  const handleNavigateToLine = () => {
    if (onNavigateToLine && typeof issue.line === 'number') {
      onNavigateToLine(issue.line);
    }
  };

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
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border rounded-lg overflow-hidden mb-3"
    >
      <CollapsibleTrigger asChild>
        <div 
          className={cn(
            "flex items-start p-3 gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
          )}
        >
          <div className="mt-0.5">
            {getIssueIcon()}
          </div>
          <div className="flex-1">
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
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
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
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Explicitly export VerificationIssue as IssueCard for backward compatibility
export { VerificationIssue as IssueCard };
