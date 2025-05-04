import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  History, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Project, VerificationIssue } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VerificationIssuesList } from "@/components/verification/VerificationIssuesList";

type VerificationResult = {
  id: string;
  project_id: string;
  level: 'simple' | 'medium' | 'advanced';
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  results: any[];
}

export default function VerificationHistoryPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<VerificationResult | null>(null);
  const [issues, setIssues] = useState<VerificationIssue[]>([]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_projects');
      if (error) throw error;
      setProjects(data || []);
      
      // Find current project
      if (projectId) {
        const found = data?.find(p => p.id === projectId);
        if (found) setCurrentProject(found);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchVerificationHistory = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_project_verification_results', { p_project_id: id });
      
      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error("Error fetching verification history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (currentProject) {
      fetchVerificationHistory(currentProject.id);
    }
  }, [currentProject]);

  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId);
    if (selectedProject) {
      setCurrentProject(selectedProject);
      navigate(`/verification-history/${projectId}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
      case 'running':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'simple':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Simple</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medium</Badge>;
      case 'advanced':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Advanced</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const viewDetails = async (result: VerificationResult) => {
    setSelectedResult(result);
    
    try {
      let formattedIssues: VerificationIssue[] = [];
      
      if (result.results && Array.isArray(result.results)) {
        formattedIssues = result.results.map((issue: any, index: number) => ({
          id: `${result.id}-issue-${index}`,
          file: issue.file || 'Unknown file',
          line: issue.line_number || issue.line || 0,
          type: issue.type || (issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'warning' : 'info'),
          title: issue.error_type || issue.title || 'Issue',
          severity: issue.severity || 'medium',
          confidence: issue.confidence || 'Medium',
          description: issue.description || '',
          code: issue.code_snippet || issue.code || '',
          function_name: issue.function_name || '',
          contract_name: issue.contract_name || '',
          suggested_fix: issue.suggested_fix || ''
        }));
      }
      
      setIssues(formattedIssues);
      setDetailDialogOpen(true);
    } catch (error) {
      console.error("Error formatting issues:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1 container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Verification History</h1>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center cursor-pointer group hover:opacity-80 transition-all">
                    <h2 className="text-3xl font-bold text-primary pr-2 hover:text-primary/90 transition-colors">
                      {currentProject?.name || "Select a project"}
                    </h2>
                    <ChevronDown className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {projects.map((project) => (
                    <DropdownMenuItem 
                      key={project.id} 
                      className="cursor-pointer"
                      onClick={() => handleProjectChange(project.id)}
                    >
                      {project.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
            <CardDescription className="pt-2">
              {currentProject ? (
                `Viewing verification history for ${currentProject.name}`
              ) : (
                "Select a project to view its verification history"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : results.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center font-medium">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            {format(new Date(result.created_at), "MMM dd, yyyy")}
                          </span>
                          <span className="flex items-center text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1.5" />
                            {format(new Date(result.created_at), "HH:mm:ss")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getLevelBadge(result.level)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusIcon(result.status)}
                          <span className="ml-2">{getStatusBadge(result.status)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetails(result)}
                          className="flex items-center"
                        >
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : currentProject ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No verification history yet</h3>
                <p className="text-muted-foreground mt-1">
                  Run your first verification in the dashboard to see results here.
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Please select a project to view verification history
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Result Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center space-x-2">
              <span>Verification Results</span>
              <span className="ml-2">{selectedResult?.level && getLevelBadge(selectedResult.level)}</span>
              <span>{selectedResult?.status && getStatusBadge(selectedResult.status)}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedResult && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{format(new Date(selectedResult.created_at), "MMMM dd, yyyy 'at' HH:mm:ss")}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 mt-4">
            <div className="pr-4">
              {issues.length > 0 ? (
                <VerificationIssuesList 
                  issues={issues}
                  maxHeight="60vh"
                  projectName={currentProject?.name}
                />
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No issues found</h3>
                  <p className="text-muted-foreground mt-1">
                    This verification did not detect any issues.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
