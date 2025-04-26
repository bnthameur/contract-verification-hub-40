import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { ResizableLayout } from "@/components/layout/ResizableLayout";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { VerificationPanel } from "@/components/verification/VerificationPanel";
import { LogicValidation } from "@/components/verification/LogicValidation";
import { Project, VerificationResult, VerificationLevel, VerificationStatus } from "@/types";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Save, Upload, FileSymlink, PlusCircle, FileCode, File } from "lucide-react";
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
    await handleSaveCode();
    
    if (level === VerificationLevel.ADVANCED) {
      setActiveVerificationTab("logic-validation");
      setIsLoadingAILogic(true);
      
      // Simulate AI generating logic (in a real app, this would call an API)
      setTimeout(async () => {
        try {
          if (!activeProject) return;
          
          const logicText = `# Auto-generated logic for ${activeProject.name}\n\nThis smart contract appears to be a ${getContractDescription(code)}.\n\nProperties to verify:\n- No integer overflow or underflow\n- No reentrancy vulnerabilities\n- Functions can only be called by authorized roles\n- State changes preserve expected invariants\n\nPlease review and edit these properties to match your verification requirements.`;
          
          // Create initial verification record with the AI-generated logic
          const initialResult: Partial<VerificationResult> = {
            project_id: activeProject.id,
            level: VerificationLevel.ADVANCED,
            status: VerificationStatus.PENDING,
            results: [],
            logs: ["Generated initial contract logic."],
            logic_text: logicText,
            created_at: new Date().toISOString(),
          };
          
          const { data: verificationRecord, error: insertError } = await supabase
            .from('verification_results')
            .insert(initialResult)
            .select()
            .single();
            
          if (insertError) throw insertError;
          
          setVerificationResult(verificationRecord);
          setIsLoadingAILogic(false);
        } catch (error) {
          console.error("Error generating logic:", error);
          setIsLoadingAILogic(false);
          toast({
            title: "Error",
            description: "Failed to generate contract logic",
            variant: "destructive"
          });
        }
      }, 3000);
      
      return;
    }
    
    setActiveVerificationTab("verification");
    
    if (activeProject) {
      await fetchLatestVerificationResult(activeProject.id);
    }
  };

  const handleConfirmLogic = async (logicText: string) => {
    if (!activeProject || !verificationResult) return;
    
    try {
      // Update the verification result with confirmed logic
      const { error } = await supabase
        .from('verification_results')
        .update({
          logic_text: logicText,
          status: VerificationStatus.RUNNING,
          logs: [...(verificationResult.logs || []), "Logic confirmed by user. Starting verification..."]
        })
        .eq('id', verificationResult.id);
        
      if (error) throw error;
      
      // Fetch the updated verification result
      await fetchLatestVerificationResult(activeProject.id);
      
      // Simulate the backend processing (in a real app, this would be done by the backend)
      setTimeout(async () => {
        if (!verificationResult) return;
        
        // Generate mock CVL code
        const mockCvlCode = `
/*
 * Generated CVL code for advanced verification
 * Based on user-confirmed logic
 */

// Import Certora prover library
using CertoraProver;

// Define rules
rule noReentrancy(method f) {
    env e;
    calldataarg args;
    
    // Check for reentrancy
    f(e, args);
    
    // Assert no reentrancy
    assert !lastReverted, "Method should not revert";
}

rule preservesTotalSupply(method f) {
    env e;
    calldataarg args;
    
    uint256 totalSupplyBefore = totalSupply();
    
    f(e, args);
    
    uint256 totalSupplyAfter = totalSupply();
    
    assert totalSupplyBefore == totalSupplyAfter, "Total supply should remain constant";
}

// Add more rules based on confirmed logic
`;
        
        // Mock verification issues
        const mockIssues = [
          {
            verification_id: verificationResult.id,
            error_type: "Reentrancy",
            severity: "high" as const,
            description: "Potential reentrancy vulnerability in transfer function",
            line_number: 45,
            column_number: 4,
            function_name: "transfer",
            contract_name: activeProject?.name,
            suggested_fix: "Consider implementing a reentrancy guard or following the checks-effects-interactions pattern",
            code_snippet: "function transfer(address to, uint256 amount) public { ... }"
          },
          {
            verification_id: verificationResult.id,
            error_type: "Arithmetic",
            severity: "medium" as const,
            description: "Potential integer overflow in calculateReward function",
            line_number: 67,
            column_number: 12,
            function_name: "calculateReward",
            contract_name: activeProject?.name,
            suggested_fix: "Use SafeMath or Solidity 0.8+ for automatic overflow checking",
            code_snippet: "uint256 reward = amount * rate;"
          }
        ];
        
        // Insert mock issues
        for (const issue of mockIssues) {
          await supabase.from('verification_issues').insert(issue);
        }
        
        // Update the verification result
        await supabase
          .from('verification_results')
          .update({
            status: VerificationStatus.COMPLETED,
            cvl_code: mockCvlCode,
            completed_at: new Date().toISOString(),
            logs: [...(verificationResult.logs || []), 
              "Generated CVL code from logic", 
              "Running Certora Prover...", 
              "Verification completed with 2 issues found"]
          })
          .eq('id', verificationResult.id);
          
        // Fetch the updated result
        await fetchLatestVerificationResult(activeProject.id);
        
        toast({
          title: "Verification complete",
          description: "Advanced verification has completed. Check the results tab for details.",
        });
      }, 5000);
      
      // Switch to verification tab to show results
      setActiveVerificationTab("verification");
    } catch (error: any) {
      console.error("Error confirming logic:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process verification",
        variant: "destructive"
      });
    }
  };

  const handleCancelLogicValidation = async () => {
    if (verificationResult?.status === VerificationStatus.PENDING) {
      try {
        await supabase
          .from('verification_results')
          .delete()
          .eq('id', verificationResult.id);
        setVerificationResult(undefined);
      } catch (error) {
        console.error("Error cancelling verification:", error);
      }
    }
    
    setActiveVerificationTab("verification");
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
                  <span className="text-muted-foreground text-sm">Project:</span>
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
            <div className="overflow-auto p-4 h-full">
              <Tabs
                value={activeVerificationTab}
                onValueChange={val => setActiveVerificationTab(val as "verification" | "logic-validation")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="verification">Verification</TabsTrigger>
                  <TabsTrigger value="logic-validation">Logic Validation</TabsTrigger>
                </TabsList>

                <TabsContent value="verification" className="h-full">
                  <VerificationPanel 
                    projectId={activeProject?.id || ''} 
                    code={code}
                    onVerify={handleStartVerification}
                    onStop={handleStopVerification}
                    result={verificationResult}
                    onNavigateToLine={handleNavigateToLine}
                  />
                </TabsContent>

                <TabsContent value="logic-validation" className="h-full">
                  <LogicValidation
                    projectId={activeProject?.id || ''}
                    code={code}
                    result={verificationResult}
                    onConfirmLogic={handleConfirmLogic}
                    onCancel={handleCancelLogicValidation}
                    isLoadingAILogic={isLoadingAILogic}
                  />
                </TabsContent>
              </Tabs>
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
