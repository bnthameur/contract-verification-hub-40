import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { ResizableLayout } from "@/components/layout/ResizableLayout";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { CvlCodeViewer } from "@/components/editor/CvlCodeViewer";
import { DeploymentPanel } from "@/components/editor/DeploymentPanel";
import { VerificationPanel } from "@/components/verification/VerificationPanel";
import { LogicValidation } from "@/components/verification/LogicValidation";
import { Project, VerificationResult, VerificationLevel, VerificationStatus } from "@/types";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Save, Upload, FileSymlink, PlusCircle, FileCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { LightRay } from "@/components/layout/LightRay";
import { ProjectCreationDialog } from "@/components/project/ProjectCreationDialog";
import { useRealtimeVerification } from "@/hooks/useRealtimeVerification";
import * as monaco from "monaco-editor";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | undefined>();
  const [code, setCode] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"code" | "tests" | "deployment">("code");
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Use the new real-time verification hook
  const {
    verificationResult,
    isLoading: isVerificationLoading,
    refetch: refetchVerification
  } = useRealtimeVerification({
    projectId: activeProject?.id,
    onVerificationUpdate: (result) => {
      console.log("Real-time verification update:", result);
    }
  });

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching projects for user:', user.id);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      console.log('Projects fetched:', data);
      
      if (data) {
        setProjects(data);
        if (data.length > 0 && !activeProject) {
          setActiveProject(data[0]);
          setCode(data[0].code);
        }
      }
    } catch (error: any) {
      console.error('Error in fetchProjects:', error);
      toast({
        title: "Error fetching projects",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveCode = async () => {
    if (!activeProject || !user) return;
    
    try {
      console.log('Saving code for project:', activeProject.id);
      
      const { error } = await supabase
        .from('projects')
        .update({
          code,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeProject.id)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error saving project:', error);
        throw error;
      }
      
      const updatedProject = {
        ...activeProject,
        code,
        updated_at: new Date().toISOString(),
      };
      
      setProjects(prev => 
        prev.map(p => p.id === activeProject.id ? updatedProject : p)
      );
      setActiveProject(updatedProject);
      
      toast({
        title: "Project saved",
        description: "Your code changes have been saved.",
      });
    } catch (error: any) {
      console.error('Error in handleSaveCode:', error);
      toast({
        title: "Error saving project",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateProject = async (name: string, description: string) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to create a project.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Creating new project for user:', user.id);
      
      const newProject = {
        name,
        description,
        code: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract ${name.replace(/\s+/g, '')} {\n    // Your code here\n}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Creating project with data:', newProject);
      
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();
        
      if (error) {
        console.error('Project creation error:', error);
        throw error;
      }
      
      if (data) {
        console.log('Project created successfully:', data);
        setProjects(prev => [data, ...prev]);
        setActiveProject(data);
        setCode(data.code);
        setIsCreatingProject(false);
        
        toast({
          title: "Project created",
          description: `${data.name} has been created successfully.`,
        });
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      const file = e.dataTransfer.files?.[0];
      if (!file || !user) return;
      
      await handleFileUploadLogic(file);
    },
    [user]
  );

  const handleFileUploadLogic = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to upload a file.",
        variant: "destructive",
      });
      return;
    }
    
    if (!file.name.endsWith('.sol')) {
      toast({
        title: "Invalid file",
        description: "Please upload a Solidity (.sol) file",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      console.log('Uploading file for user:', user.id);
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const fileContent = e.target?.result as string;
          
          const fileName = file.name.replace('.sol', '');
          
          const newProject = {
            name: fileName,
            description: `Imported from ${file.name}`,
            code: fileContent,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('Creating project from file with data:', newProject);
          
          const { data, error } = await supabase
            .from('projects')
            .insert(newProject)
            .select()
            .single();
            
          if (error) {
            console.error('File import error:', error);
            throw error;
          }
          
          if (data) {
            console.log('Project from file created successfully:', data);
            setProjects(prev => [data, ...prev]);
            setActiveProject(data);
            setCode(data.code);
            
            toast({
              title: "File imported",
              description: `${fileName} has been imported successfully.`,
            });
          }
        } catch (error: any) {
          console.error('Error in file reader onload:', error);
          toast({
            title: "Error importing file",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: "Error reading file",
          description: "Failed to read the uploaded file",
          variant: "destructive",
        });
      };
      
      reader.readAsText(file);
    } catch (error: any) {
      console.error('Error importing file:', error);
      toast({
        title: "Error importing file",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    await handleFileUploadLogic(file);
    
    // Clear the input so the same file can be uploaded again
    event.target.value = '';
  };

  const handleStartVerification = async (level: string) => {
    await handleSaveCode();
    
    if (!activeProject) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured. Please check environment variables.");
      }
      
      const endpoint = level === VerificationLevel.DEEP ? '/verify/deep' : '/verify/simple';
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: activeProject.id
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("Verification started:", responseData);
      
      // The real-time hook will automatically pick up the new verification
      
    } catch (error) {
      console.error("Error starting verification:", error);
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Failed to start verification",
        variant: "destructive"
      });
    }
  };

  const handleConfirmLogic = async (logicText: string) => {
    if (!activeProject || !verificationResult) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured. Please check environment variables.");
      }
      
      const response = await fetch(`${apiUrl}/verify/confirm/${verificationResult.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logicText),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(`API request failed: ${response.statusText} (${response.status})`);
      }
      
      const responseData = await response.json();
      console.log("Logic confirmation response:", responseData);
      
      toast({
        title: "Verification In Progress",
        description: "Your logic has been confirmed and verification has started",
      });
      
    } catch (error) {
      console.error("Error confirming logic:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process verification",
        variant: "destructive"
      });
    }
  };

  const handleCancelLogicValidation = async () => {
    if (!verificationResult) return;
    
    try {
      await supabase
        .from('verification_results')
        .update({
          status: VerificationStatus.FAILED,
          completed_at: new Date().toISOString(),
          error_message: "Verification cancelled by user"
        })
        .eq('id', verificationResult.id);
        
    } catch (error) {
      console.error("Error cancelling verification:", error);
    }
  };

  const handleCancelVerification = async (verificationId: string) => {
    try {
      await supabase
        .from('verification_results')
        .update({
          status: VerificationStatus.FAILED,
          completed_at: new Date().toISOString(),
          error_message: "Verification cancelled by user"
        })
        .eq('id', verificationId);
      
      toast({
        title: "Verification Stopped",
        description: "The verification process has been cancelled."
      });
    } catch (error) {
      console.error("Error cancelling verification:", error);
      toast({
        title: "Error",
        description: "Failed to cancel the verification process.",
        variant: "destructive"
      });
    }
  };

  const handleNavigateToLine = (lineNumber: number) => {
    if (!editorRef.current) return;
    
    editorRef.current.revealLineInCenter(lineNumber);
    editorRef.current.setPosition({ lineNumber, column: 1 });
    
    const decorations = editorRef.current.createDecorationsCollection([
      { 
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: { 
          isWholeLine: true,
          className: 'bg-primary/20',
          glyphMarginClassName: 'bg-primary/40'
        }
      }
    ]);
    
    editorRef.current.focus();
    
    setTimeout(() => {
      decorations.clear();
    }, 3000);
  };

  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    if (activeProject) {
      setCode(activeProject.code);
    }
  }, [activeProject]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      const file = e.dataTransfer.files?.[0];
      if (!file || !user) return;
      
      await handleFileUploadLogic(file);
    },
    [user]
  );

  const renderProjectContent = () => {
    return (
      <>
        <ResizableLayout
          sidebarContent={
            <Sidebar
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProject}
              onCreateProject={() => setIsCreatingProject(true)}
              onRefreshProjects={fetchProjects}
            />
          }
          mainContent={
            <div className="flex flex-col h-full">
              <div className="border-b px-6 py-3 flex items-center justify-between bg-card/50">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">Project</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{activeProject?.name}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-xs text-muted-foreground">
                    Last saved: {activeProject ? new Date(activeProject.updated_at).toLocaleString() : ''}
                  </div>
                  <Button size="sm" onClick={handleSaveCode} className="gap-1.5">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>

              <div className="flex flex-col h-full">
                <Tabs value={activeCodeTab} onValueChange={(value) => setActiveCodeTab(value as any)} className="flex-1 flex flex-col">
                  <TabsList className="mx-4 mt-2">
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="tests">Tests</TabsTrigger>
                    <TabsTrigger value="deployment">Deployment</TabsTrigger>
                  </TabsList>

                  <TabsContent value="code" className="flex-1 p-0 overflow-hidden">
                    <MonacoEditor 
                      value={code} 
                      onChange={setCode} 
                      onEditorMount={handleEditorMount}
                    />
                  </TabsContent>

                  <TabsContent value="tests" className="flex-1 p-0 overflow-hidden">
                    {activeProject && (
                      <CvlCodeViewer projectId={activeProject.id} />
                    )}
                  </TabsContent>

                  <TabsContent value="deployment" className="flex-1 p-0 overflow-hidden">
                    <DeploymentPanel 
                      contractCode={code}
                      contractName={activeProject?.name}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          }
          verificationContent={
            <div className="h-full">
              <VerificationPanel
                project={activeProject}
                onNavigateToLine={handleNavigateToLine}
                onStartVerification={handleStartVerification}
                onCancelLogicValidation={handleCancelLogicValidation}
                onConfirmLogicVerification={handleConfirmLogic}
                onCancelVerification={handleCancelVerification}
                verificationResult={verificationResult}
                isRunningVerification={isVerificationLoading}
                isLoadingAILogic={false}
                isPollingResults={false}
              />
            </div>
          }
        />
      </>
    );
  };

  const renderWelcomeScreen = () => {
    return (
      <div 
        className="flex-1 flex items-center justify-center"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`text-center max-w-md p-6 transition-all ${isDragging ? 'scale-105 opacity-70' : ''}`}>
          <h2 className="text-2xl font-semibold mb-4">Welcome to FormalBase</h2>
          <p className="text-muted-foreground mb-8">
            Start by creating a new project or importing a Solidity file
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => setIsCreatingProject(true)}
              className="w-full flex items-center justify-center gap-2 p-6 h-auto flex-col"
              variant="outline"
            >
              <FileCode className="h-10 w-10 mb-2 text-primary" />
              <span>Create New Project</span>
            </Button>
            
            <label>
              <input
                type="file"
                accept=".sol"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
              <div className={`w-full flex items-center justify-center gap-2 p-6 h-full flex-col cursor-pointer border rounded-md ${isUploading ? 'opacity-70' : 'hover:border-primary hover:text-primary transition-colors'}`}>
                <Upload className="h-10 w-10 mb-2 text-primary" />
                <span>{isUploading ? 'Uploading...' : 'Upload Solidity File'}</span>
              </div>
            </label>
          </div>
          
          {isDragging && (
            <div className="absolute inset-0 border-2 border-dashed border-primary bg-primary/5 flex items-center justify-center rounded-lg z-10">
              <div className="text-center">
                <FileSymlink className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-medium">Drop your Solidity file here</h3>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col">
      <LightRay />
      <Navbar hideUser />

      <div className="flex flex-1 overflow-hidden">
        {activeProject ? renderProjectContent() : renderWelcomeScreen()}
      </div>

      <ProjectCreationDialog
        open={isCreatingProject}
        onOpenChange={setIsCreatingProject}
        onCreateProject={handleCreateProject}
        onFileUpload={handleFileUploadLogic}
      />
    </div>
  );
}
