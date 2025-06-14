import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { ResizableLayout } from "@/components/layout/ResizableLayout";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
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
import * as monaco from "monaco-editor";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | undefined>();
  const [code, setCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [activeVerificationTab, setActiveVerificationTab] = useState<"verification" | "logic-validation">("verification");
  const [isLoadingAILogic, setIsLoadingAILogic] = useState(false);
  const [isRunningVerification, setIsRunningVerification] = useState(false);
  const [isPollingResults, setIsPollingResults] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
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

  const fetchLatestVerificationResult = async (project_id: string) => {
    try {
      const { data, error } = await supabase
        .from('verification_results')
        .select('*')
        .eq('project_id', project_id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setVerificationResult(data[0]);
        
        // If verification is still running, start polling
        if (data[0].status === VerificationStatus.RUNNING) {
          setIsPollingResults(true);
          startPolling(project_id, data[0].id);
        } else {
          setIsPollingResults(false);
        }
      } else {
        setVerificationResult(undefined);
      }
    } catch (error: any) {
      console.error('Error fetching verification result:', error);
      // We don't show a toast here to avoid cluttering the UI
    }
  };

  // Polling function for verification results - ENHANCED to handle all states properly
  const startPolling = useCallback((projectId: string, resultId: string) => {
    console.log("Starting polling for verification:", resultId);
    
    const pollingInterval = setInterval(async () => {
      try {
        console.log("Polling verification result:", resultId);
        
        const { data, error } = await supabase
          .from('verification_results')
          .select('*')
          .eq('id', resultId)
          .single();
          
        if (error) {
          console.error('Polling error:', error);
          clearInterval(pollingInterval);
          setIsPollingResults(false);
          setIsRunningVerification(false);
          setIsLoadingAILogic(false);
          return;
        }
        
        if (data) {
          console.log("Polling received data:", {
            id: data.id,
            status: data.status,
            hasSpecDraft: !!data.spec_draft,
            hasResults: !!(data.results && data.results.length > 0),
            resultsCount: data.results ? data.results.length : 0
          });
          
          setVerificationResult(data);
          
          // Enhanced stopping conditions
          const shouldStopPolling = 
            data.status === VerificationStatus.COMPLETED || 
            data.status === VerificationStatus.FAILED ||
            (data.status === VerificationStatus.AWAITING_CONFIRMATION && data.spec_draft);
          
          if (shouldStopPolling) {
            console.log("Stopping polling due to condition:", {
              status: data.status,
              hasSpecDraft: !!data.spec_draft,
              shouldStopPolling
            });
            
            clearInterval(pollingInterval);
            setIsPollingResults(false);
            setIsRunningVerification(false);
            setIsLoadingAILogic(false);
            
            // Show appropriate toast based on the result
            if (data.status === VerificationStatus.COMPLETED) {
              toast({
                title: "Verification Complete",
                description: `Found ${data.results ? data.results.length : 0} issues`,
              });
            } else if (data.status === VerificationStatus.AWAITING_CONFIRMATION && data.spec_draft) {
              toast({
                title: "Logic Ready",
                description: "Review and confirm the generated verification logic",
              });
            }
          } else {
            console.log("Continuing polling, verification still in progress:", data.status);
          }
        }
      } catch (error) {
        console.error('Error in polling:', error);
        clearInterval(pollingInterval);
        setIsPollingResults(false);
        setIsRunningVerification(false);
        setIsLoadingAILogic(false);
      }
    }, 1500); // Poll every 1.5 seconds for more responsive updates
    
    return () => clearInterval(pollingInterval);
  }, [toast]);

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
    
    // Clear the input so the same file can be uploaded again
    event.target.value = '';
  };

  
const handleStartVerification = async (level: string) => {
  await handleSaveCode();
  
  if (!activeProject) return;
  
  setIsRunningVerification(true);
  
  if (level === VerificationLevel.DEEP) {
    setIsLoadingAILogic(true);
    
    try {
      if (!activeProject) {
        setIsLoadingAILogic(false);
        setIsRunningVerification(false);
        return;
      }
      
      // Make actual API call to generate logic
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured. Please check environment variables.");
      }
      
      console.log("Starting deep verification with backend at:", apiUrl);
      
      // Create initial verification record with pending status
      const initialResult: Partial<VerificationResult> = {
        project_id: activeProject.id,
        level: VerificationLevel.DEEP,
        status: VerificationStatus.PENDING,
        results: [],
        logs: ["Starting deep verification process..."],
        created_at: new Date().toISOString(),
      };
      
      const { data: verificationRecord, error: insertError } = await supabase
        .from('verification_results')
        .insert(initialResult)
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      setVerificationResult(verificationRecord);
      
      // Start polling immediately after creating the record
      setIsPollingResults(true);
      startPolling(activeProject.id, verificationRecord.id);
      
      // Now make actual API call to backend
      const response = await fetch(`${apiUrl}/verify/deep`, {
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
      console.log("Deep verification response:", responseData);
      
      // Polling is already started, just turn off local loading
      setIsLoadingAILogic(false);
      
    } catch (error) {
      console.error("Error in deep verification:", error);
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Failed to generate verification logic",
        variant: "destructive"
      });
      
      // Update status to failed if there's an error
      if (verificationResult?.id) {
        await supabase
          .from('verification_results')
          .update({
            status: VerificationStatus.FAILED,
            error_message: error instanceof Error ? error.message : "Unknown error",
            completed_at: new Date().toISOString()
          })
          .eq('id', verificationResult.id);
      }
      
      setIsLoadingAILogic(false);
      setIsRunningVerification(false);
      setIsPollingResults(false);
    }
    
    return;
  }
  
  // Simple verification flow
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      throw new Error("API URL not configured. Please check environment variables.");
    }
    
    console.log("Starting simple verification with backend at:", apiUrl);
    
    // Create initial verification record
    const initialResult: Partial<VerificationResult> = {
      project_id: activeProject.id,
      level: level as VerificationLevel,
      status: VerificationStatus.RUNNING,
      results: [],
      logs: ["Starting verification process..."],
      created_at: new Date().toISOString(),
    };
    
    const { data: verificationRecord, error: insertError } = await supabase
      .from('verification_results')
      .insert(initialResult)
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    setVerificationResult(verificationRecord);
    setIsPollingResults(true);
    
    // Start polling immediately
    startPolling(activeProject.id, verificationRecord.id);
    
    const response = await fetch(`${apiUrl}/verify/simple`, {
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
    console.log("Simple verification response:", responseData);
    
  } catch (error) {
    console.error("Error starting verification:", error);
    setIsRunningVerification(false);
    setIsPollingResults(false);
    
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
    
    console.log("Confirming logic with backend at:", apiUrl);
    
    // Update the verification result with confirmed logic and start polling again
    const { error } = await supabase
      .from('verification_results')
      .update({
        spec_draft: logicText,
        status: VerificationStatus.RUNNING,
        logs: [...(verificationResult.logs || []), "Logic confirmed by user. Starting verification..."]
      })
      .eq('id', verificationResult.id);
      
    if (error) throw error;
    
    // Restart polling for the running verification
    setIsPollingResults(true);
    setIsRunningVerification(true);
    startPolling(activeProject.id, verificationResult.id);
    
    // Send the logicText as a plain string, not wrapped in an object
    const response = await fetch(`${apiUrl}/verify/confirm/${verificationResult.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logicText), // Send the text directly as a string in JSON
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
    
    // Update status to failed if there's an error
    await supabase
      .from('verification_results')
      .update({
        status: VerificationStatus.FAILED,
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString()
      })
      .eq('id', verificationResult.id);
      
    setIsRunningVerification(false);
    setIsPollingResults(false);
  }
};

const handleCancelLogicValidation = async () => {
  if (!verificationResult) return;
  
  try {
    if (verificationResult.status === VerificationStatus.PENDING) {
      await supabase
        .from('verification_results')
        .delete()
        .eq('id', verificationResult.id);
    } else {
      await supabase
        .from('verification_results')
        .update({
          status: VerificationStatus.FAILED,
          completed_at: new Date().toISOString(),
          error_message: "Verification cancelled by user"
        })
        .eq('id', verificationResult.id);
    }
    
    setVerificationResult(undefined);
  } catch (error) {
    console.error("Error cancelling verification:", error);
  } finally {
    setActiveVerificationTab("verification");
  }
};

const handleCancelVerification = async (verificationId: string) => {
  if (!verificationId) return;
  
  try {
    console.log(`Cancelling verification with ID: ${verificationId}`);
    
    // Update the verification result status in database
    const { error } = await supabase
      .from('verification_results')
      .update({
        status: VerificationStatus.FAILED,
        completed_at: new Date().toISOString(),
        error_message: "Verification cancelled by user"
      })
      .eq('id', verificationId);
      
    if (error) {
      console.error("Error cancelling verification:", error);
      throw error;
    }
    
    // Stop polling and reset loading states
    setIsRunningVerification(false);
    setIsPollingResults(false);
    setIsLoadingAILogic(false);
    
    // Refetch the updated verification result
    if (activeProject) {
      fetchLatestVerificationResult(activeProject.id);
    }
    
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

const getContractDescription = (code: string): string => {
  if (code.includes("ERC20") || code.includes("balanceOf") || code.includes("transfer(")) {
    return "token contract with ERC20-like functionality";
  } else if (code.includes("ERC721") || code.includes("ownerOf") || code.includes("transferFrom(")) {
    return "NFT contract with ERC721-like functionality";
  } else if (code.includes("payable") || code.includes("msg.value")) {
    return "payment-handling contract";
  } else if (code.includes("owner") || code.includes("onlyOwner")) {
    return "contract with ownership controls";
  } else {
    return "basic contract";
  }
};

useEffect(() => {
  if (activeProject) {
    setCode(activeProject.code);
    fetchLatestVerificationResult(activeProject.id);
  }
}, [activeProject]);

// Cleanup polling on unmount
useEffect(() => {
  return () => {
    setIsPollingResults(false);
  };
}, []);

const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDragLeave = () => {
  setIsDragging(false);
};

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
              <Tabs defaultValue="code" className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-2">
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="tests">Tests</TabsTrigger>
                  <TabsTrigger value="deployment" disabled>Deployment</TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="flex-1 p-0 overflow-hidden">
                  <MonacoEditor 
                    value={code} 
                    onChange={setCode} 
                    onEditorMount={handleEditorMount}
                  />
                </TabsContent>

                <TabsContent value="tests" className="flex-1 p-0 overflow-hidden">
                  {verificationResult?.cvl_code ? (
                    <MonacoEditor 
                      value={verificationResult.cvl_code}
                      onChange={() => {}}
                      options={{
                        readOnly: true,
                        language: 'plaintext',
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-6">
                        <h3 className="text-lg font-medium mb-2">No CVL code available</h3>
                        <p className="text-muted-foreground mb-4">
                          Run an advanced verification to generate CVL code
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="deployment" className="flex-1 p-0 overflow-hidden">
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Deployment features coming soon.
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        }
        verificationContent={
          <div className="h-full">
            <VerificationPanel
              project={activeProject}
              activeTab={verificationLevel}
              onNavigateToLine={handleNavigateToLine}
              onStartVerification={handleStartVerification}
              onCancelLogicValidation={handleCancelLogicValidation}
              onConfirmLogicVerification={handleConfirmLogic}
              onCancelVerification={handleCancelVerification}
              verificationResult={verificationResult}
              isRunningVerification={isRunningVerification}
              isLoadingAILogic={isLoadingAILogic}
              isPollingResults={isPollingResults}
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

// Create verification level state
const [verificationLevel, setVerificationLevel] = useState<string>("simple");

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
