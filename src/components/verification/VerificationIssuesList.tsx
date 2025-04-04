
import { VerificationIssue } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck } from "lucide-react";
import { IssueCard } from "./VerificationIssue";
import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface VerificationIssuesListProps {
  issues: VerificationIssue[];
  onNavigateToLine?: (line: number) => void;
  className?: string;
  maxHeight?: string;
}

export function VerificationIssuesList({ 
  issues, 
  onNavigateToLine,
  className = "",
  maxHeight = "100%" 
}: VerificationIssuesListProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const filteredIssues = issues.filter(issue => {
    // Apply type filter
    if (filterType !== "all" && issue.type !== filterType) {
      return false;
    }
    
    // Apply search filter (if any)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        issue.message?.toLowerCase().includes(query) ||
        issue.code?.toLowerCase().includes(query) ||
        issue.function_name?.toLowerCase().includes(query) ||
        issue.contract_name?.toLowerCase().includes(query) ||
        issue.suggested_fix?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Sort issues by severity (high to low)
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const aVal = severityOrder[a.severity as keyof typeof severityOrder] || 0;
    const bVal = severityOrder[b.severity as keyof typeof severityOrder] || 0;
    return bVal - aVal;
  });
  
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
      <div className="flex gap-2 mb-3">
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
        
        <Input
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>
      
      <div className="text-sm text-muted-foreground mb-2">
        {sortedIssues.length} {sortedIssues.length === 1 ? 'issue' : 'issues'} found
      </div>
      
      <ScrollArea className="flex-1" style={{ maxHeight }}>
        <div className="space-y-3 pr-4">
          {sortedIssues.map((issue, index) => (
            <IssueCard 
              key={index} 
              issue={issue} 
              onNavigateToLine={onNavigateToLine}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
