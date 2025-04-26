
import { VerificationIssue } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Eye, History } from "lucide-react";
import { IssueCard } from "./VerificationIssue";
import { useState } from "react";
import { IssuesDialog } from "./IssuesDialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VerificationIssuesListProps {
  issues: VerificationIssue[];
  onNavigateToLine?: (line: number) => void;
  className?: string;
  maxHeight?: string;
  projectName?: string;
}

export function VerificationIssuesList({ 
  issues, 
  onNavigateToLine,
  className = "",
  maxHeight = "100%",
  projectName
}: VerificationIssuesListProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string>();
  const navigate = useNavigate();
  
  const filteredIssues = issues.filter(issue => {
    if (filterType !== "all" && issue.type !== filterType) {
      return false;
    }
    return true;
  });
  
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
  
  const handleOpenDialog = (issueId: string) => {
    setSelectedIssueId(issueId);
    setDialogOpen(true);
  };
  
  if (issues.length === 0) {
    return (
      <div className={`flex h-full flex-col items-center justify-center text-center p-4 ${className}`}>
        <ShieldCheck className="h-10 w-10 text-green-500 mb-2" />
        <h3 className="text-lg font-medium">No issues found</h3>
        <p className="text-sm text-muted-foreground">
          Your code looks clean!
        </p>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            View History
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {sortedIssues.length} {sortedIssues.length === 1 ? 'issue' : 'issues'} found
          {projectName && ` in ${projectName}`}
        </div>
      </div>
      
      <ScrollArea className="flex-1" style={{ maxHeight }}>
        <div className="space-y-3 pr-4">
          {sortedIssues.map((issue) => (
            <div key={issue.id} className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2 z-10 h-6 w-6"
                onClick={() => handleOpenDialog(issue.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <IssueCard 
                issue={issue}
                onNavigateToLine={onNavigateToLine}
              />
            </div>
          ))}
        </div>
      </ScrollArea>

      <IssuesDialog
        issues={sortedIssues}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedIssueId={selectedIssueId}
        onNavigateToLine={onNavigateToLine}
      />
    </div>
  );
}
