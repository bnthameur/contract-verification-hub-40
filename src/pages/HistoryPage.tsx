import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Project, VerificationIssue, VerificationResult, VerificationStatus } from "@/types";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Eye, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { VerificationIssueDetailed } from "@/components/verification/VerificationIssueDetailed";
import { cn } from "@/lib/utils";
import * as monaco from "monaco-editor";

export default function HistoryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [verifications, setVerifications] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<VerificationResult | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<VerificationIssue | null>(null);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  useEffect(() => {
    if (!projectId) return;
    
    const fetchProjectAndVerifications = async () => {
      setLoading(true);
      try {
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        
        if (projectError) throw projectError;
        
        setProject(projectData);
        
        // Fetch verification history
        const { data: verificationData, error: verificationError } = await supabase
          .from('verification_results')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        if (verificationError) throw verificationError;
        
        setVerifications(verificationData);
        
        // Set first verification as selected by default if available
        if (verificationData.length > 0) {
          setSelectedVerification(verificationData[0]);
        }
        
      } catch (error: any) {
        console.error("Error fetching project data:", error);
        toast({
          title: "Error",
          description: "Failed to load project history. " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectAndVerifications();
  }, [projectId, toast]);
  
  // Handle highlighting lines in the code editor
  const handleHighlightLines = (lines: number | number[]) => {
    if (!editorInstance) return;
    
    const lineNumbers = Array.isArray(lines) ? lines : [lines];
    setHighlightedLines(lineNumbers);
    
    // Highlight lines in editor
    if (lineNumbers.length > 0) {
      const firstLine = lineNumbers[0];
      
      // Clear previous decorations
      editorInstance.deltaDecorations([], []);
      
      // Add new decorations
      const decorations = lineNumbers.map(line => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'bg-yellow-500/20',
          overviewRuler: {
            color: 'rgba(250, 204, 21, 0.7)',
            position: monaco.editor.OverviewRulerLane.Full
          }
        }
      }));
      
      editorInstance.deltaDecorations([], decorations);
      
      // Scroll to the first highlighted line
      editorInstance.revealLineInCenter(firstLine);
    }
  };
  
  // Format date display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP 'at' p");
    } catch (error) {
      return dateString;
    }
  };
  
  // Get status badge for verification
  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.COMPLETED:
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case VerificationStatus.FAILED:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case VerificationStatus.RUNNING:
        return <Badge variant="outline" className="text-blue-500 border-blue-500"><Clock className="h-3 w-3 mr-1 animate-spin" /> Running</Badge>;
      case VerificationStatus.PENDING:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case VerificationStatus.AWAITING_CONFIRMATION:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Awaiting Confirmation</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const getVerificationType = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'simple':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Simple</Badge>;
      case 'advanced':
      case 'deep':
        return <Badge variant="outline" className="text-purple-500 border-purple-500">Advanced</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };
  
  // Get icon based on issue severity
  const getIssueIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
      default:
        return <ShieldAlert className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getVerificationResultSummary = (verification: VerificationResult) => {
    if (!verification.results || !Array.isArray(verification.results)) return "No issues found";
    
    const issues = verification.results;
    if (issues.length === 0) return "No issues found";
    
    const errorCount = issues.filter(issue => issue.type === 'error').length;
    const warningCount = issues.filter(issue => issue.type === 'warning').length;
    const infoCount = issues.filter(issue => issue.type === 'info').length;
    
    return [
      errorCount > 0 ? `${errorCount} error${errorCount !== 1 ? 's' : ''}` : '',
      warningCount > 0 ? `${warningCount} warning${warningCount !== 1 ? 's' : ''}` : '',
      infoCount > 0 ? `${infoCount} info` : '',
    ].filter(Boolean).join(', ');
  };
  
  const handleResumeVerification = async (verification: VerificationResult) => {
    if (verification.status !== VerificationStatus.AWAITING_CONFIRMATION || !verification.spec_draft) {
      toast({
        title: "Cannot Resume",
        description: "This verification cannot be resumed.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Redirecting",
      description: "Taking you back to the dashboard to resume verification.",
    });
    
    // Navigate back to dashboard - the verification panel will pick up the awaiting confirmation state
    navigate('/dashboard');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-6 space-y-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <Skeleton className="h-[600px]" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-[600px]" />
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-12">
          <Alert variant="destructive">
            <AlertTitle>Project not found</AlertTitle>
            <AlertDescription>
              The project you're looking for doesn't exist or you don't have permission to view it.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')} 
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </main>
      </div>
    );
  }
  
  const issuesForSelectedVerification = selectedVerification?.results || [];
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container py-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Verification History List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Verification History</CardTitle>
                <CardDescription>
                  Previous verifications for this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {verifications.length > 0 ? (
                    <div className="space-y-3">
                      {verifications.map((verification) => (
                        <Card 
                          key={verification.id} 
                          className={cn(
                            "cursor-pointer hover:bg-accent/50 transition-colors",
                            selectedVerification?.id === verification.id && "bg-accent"
                          )}
                          onClick={() => {
                            setSelectedVerification(verification);
                            setSelectedIssue(null);
                            setHighlightedLines([]);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {formatDate(verification.created_at)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {getVerificationResultSummary(verification)}
                                  </div>
                                </div>
                                {getStatusBadge(verification.status)}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                {getVerificationType(verification.level)}
                                {verification.status === VerificationStatus.COMPLETED && (
                                  <div className="text-xs text-muted-foreground">
                                    {verification.completed_at ? formatDate(verification.completed_at) : ''}
                                  </div>
                                )}
                              </div>
                              
                              {verification.status === VerificationStatus.AWAITING_CONFIRMATION && verification.spec_draft && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="w-full mt-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResumeVerification(verification);
                                  }}
                                >
                                  Resume Verification
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No verification history found</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Verification Details */}
          <div className="lg:col-span-2">
            {selectedVerification ? (
              <Tabs defaultValue="issues" className="h-full flex flex-col">
                <TabsList className="mb-4">
                  <TabsTrigger value="issues">Issues</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>
                
                {/* Issues Tab */}
                <TabsContent value="issues" className="flex-1">
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle>Verification Issues</CardTitle>
                      <CardDescription>
                        {issuesForSelectedVerification.length} issues found in verification on {formatDate(selectedVerification.created_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ScrollArea className="h-[550px] pr-4">
                        {issuesForSelectedVerification.length > 0 ? (
                          <div className="space-y-4">
                            {issuesForSelectedVerification.map((issue) => (
                              <Card 
                                key={issue.id} 
                                className={cn(
                                  "border-l-4",
                                  issue.severity === 'critical' && "border-l-red-600",
                                  issue.severity === 'high' && "border-l-red-500",
                                  issue.severity === 'medium' && "border-l-yellow-500",
                                  issue.severity === 'low' && "border-l-green-500"
                                )}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="pt-0.5">
                                      {getIssueIcon(issue.severity)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium mb-1">
                                        {issue.title}
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        <Badge variant={
                                          issue.type === 'error' ? 'destructive' : 
                                          issue.type === 'warning' ? 'default' : 'secondary'
                                        }>
                                          {issue.type}
                                        </Badge>
                                        
                                        <Badge variant="outline">
                                          Severity: {issue.severity}
                                        </Badge>
                                        
                                        {issue.line && (
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-6 px-2 text-xs"
                                            onClick={() => handleHighlightLines(issue.line)}
                                          >
                                            {typeof issue.line === 'number' ? `Line ${issue.line}` : 'View Lines'}
                                          </Button>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center mt-2">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-xs flex items-center gap-1"
                                          onClick={() => setSelectedIssue(
                                            selectedIssue?.id === issue.id ? null : issue
                                          )}
                                        >
                                          <Eye className="h-3.5 w-3.5 mr-1" />
                                          {selectedIssue?.id === issue.id ? "Hide Details" : "View Details"}
                                        </Button>
                                      </div>
                                      
                                      {selectedIssue?.id === issue.id && (
                                        <div className="mt-3 pt-3 border-t">
                                          <VerificationIssueDetailed
                                            issue={issue}
                                            onHighlightLines={handleHighlightLines}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-16 flex flex-col items-center">
                            <ShieldCheck className="h-16 w-16 text-green-500 mb-4" />
                            <h3 className="text-xl font-medium">No issues found</h3>
                            <p className="text-muted-foreground mt-2">
                              This verification didn't find any issues with your smart contract.
                            </p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Code Tab */}
                <TabsContent value="code" className="flex-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Contract Code</CardTitle>
                      <CardDescription>
                        Code at the time of verification
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[550px]">
                        <MonacoEditor
                          value={project.code}
                          height="550px"
                          options={{ readOnly: true }}
                          onEditorMount={(editor) => setEditorInstance(editor)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Logs Tab */}
                <TabsContent value="logs" className="flex-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Verification Logs</CardTitle>
                      <CardDescription>
                        Verification process logs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[550px] pr-4">
                        {selectedVerification.logs && selectedVerification.logs.length > 0 ? (
                          <div className="space-y-2 font-mono">
                            {selectedVerification.logs.map((log, index) => (
                              <div 
                                key={index} 
                                className="py-1 px-2 text-sm border-l-2 border-muted-foreground"
                              >
                                {log}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <p className="text-muted-foreground">No logs available</p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <h3 className="text-xl font-medium mb-2">Select a verification</h3>
                  <p className="text-muted-foreground">
                    Choose a verification from the history to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
