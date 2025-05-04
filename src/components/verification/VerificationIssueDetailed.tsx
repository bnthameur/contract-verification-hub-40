import { VerificationIssue } from "@/types";
import { Code } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerificationIssueDetailedProps {
  issue: VerificationIssue;
  onHighlightLines?: (lines: number | number[]) => void;
}

export function VerificationIssueDetailed({ issue, onHighlightLines }: VerificationIssueDetailedProps) {
  return (
    <div className="space-y-4">
      {issue.description && (
        <div className="text-sm">
          {issue.description}
        </div>
      )}

      {issue.line && onHighlightLines && (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onHighlightLines(issue.line)}
            className="text-xs"
          >
            Highlight {typeof issue.line === 'number' ? `Line ${issue.line}` : 'Affected Lines'}
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
    </div>
  );
}
