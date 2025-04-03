
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { VerificationPanel } from "@/components/verification/VerificationPanel";
import { Project, VerificationIssue, VerificationLevel, VerificationResult, VerificationStatus } from "@/types";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Save, Upload, FileSymlink, PlusCircle, FileCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { LightRay } from "@/components/layout/LightRay";
import { ProjectCreationDialog } from "@/components/project/ProjectCreationDialog";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | undefined>();
  const [code, setCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

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
          fetchLatestVerificationResult(data[0].id);
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

  const fetchLatestVerificationResult = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('verification_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setVerificationResult(data[0]);
      } else {
        setVerificationResult(undefined);
      }
    } catch (error: any) {
      console.error('Error fetching verification result:', error);
      // We don't show a toast here to avoid cluttering the UI
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
        setVerificationResult(undefined);
        
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
            setVerificationResult(undefined);
            
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
    
    event.target.value = '';
  };

  const handleStartVerification = async (level: VerificationLevel) => {
    // Save any unsaved changes first
    await handleSaveCode();
    
    // Fetch latest verification result
    if (activeProject) {
      await fetchLatestVerificationResult(activeProject.id);
    }
  };

  const handleStopVerification = async () => {
    if (!verificationResult || verificationResult.status !== VerificationStatus.RUNNING) return;
    
    try {
      const { error } = await supabase
        .from('verification_results')
        .update({
          status: VerificationStatus.FAILED,
          completed_at: new Date().toISOString(),
        })
        .eq('id', verificationResult.id);
        
      if (error) throw error;
      
      setVerificationResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: VerificationStatus.FAILED,
          completed_at: new Date().toISOString(),
        };
      });
      
      toast({
        title: "Verification stopped",
        description: "The verification process has been stopped.",
      });
    } catch (error: any) {
      toast({
        title: "Error stopping verification",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (activeProject) {
      setCode(activeProject.code);
      fetchLatestVerificationResult(activeProject.id);
    }
  }, [activeProject]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex h-screen flex-col">
      <LightRay />
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          projects={projects} 
          activeProject={activeProject} 
          onSelectProject={setActiveProject}
          onCreateProject={() => setIsCreatingProject(true)}
          onRefreshProjects={fetchProjects}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeProject ? (
            <>
              <div className="border-b px-6 py-3 flex items-center justify-between bg-card/50">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Projects</span>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <span className="font-medium text-foreground">{activeProject.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveCode} className="gap-1.5">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                <div className="col-span-2 overflow-hidden p-4 flex flex-col h-full">
                  <Tabs defaultValue="code" className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <TabsList>
                        <TabsTrigger value="code">Code</TabsTrigger>
                        <TabsTrigger value="tests" disabled>Tests</TabsTrigger>
                        <TabsTrigger value="deployment" disabled>Deployment</TabsTrigger>
                      </TabsList>
                      
                      <div className="text-xs text-muted-foreground">
                        Last saved: {new Date(activeProject.updated_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <TabsContent value="code" className="flex-1 border p-0 overflow-hidden">
                      <MonacoEditor value={code} onChange={setCode} />
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div className="border-l overflow-auto p-4">
                  <VerificationPanel 
                    projectId={activeProject.id} 
                    code={code}
                    onVerify={handleStartVerification}
                    onStop={handleStopVerification}
                    result={verificationResult}
                  />
                </div>
              </div>
            </>
          ) : (
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
          )}
        </main>
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
