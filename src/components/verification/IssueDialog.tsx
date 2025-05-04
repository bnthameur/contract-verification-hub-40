import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { VerificationIssue } from "@/types";
  import { VerificationIssue as IssueCard } from "./VerificationIssue";
  
  interface IssuesDialogProps {
    issues: VerificationIssue[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedIssueId?: string;
    onNavigateToLine?: (line: number) => void;
  }
  
  export function IssuesDialog({
    issues,
    open,
    onOpenChange,
    selectedIssueId,
    onNavigateToLine
  }: IssuesDialogProps) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Issues</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onNavigateToLine={onNavigateToLine}
                defaultOpen={issue.id === selectedIssueId}
                showInDialog
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }