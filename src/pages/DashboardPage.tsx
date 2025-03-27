
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { VerificationPanel } from "@/components/verification/VerificationPanel";
import { Project, VerificationIssue, VerificationLevel, VerificationResult, VerificationStatus } from "@/types";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronRight, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Mock data for the sample project to demonstrate UI
const MOCK_USER = {
  id: "user-1",
  email: "user@example.com",
  created_at: new Date().toISOString(),
};

const SAMPLE_PROJECT: Project = {
  id: "proj-1",
  name: "Token Contract",
  description: "ERC-20 token implementation with additional features",
  code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyToken {
    string public name = "My Token";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10 ** uint256(decimals);
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 value) public returns (bool success) {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool success) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}`,
  user_id: "user-1",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Sample projects list
const SAMPLE_PROJECTS: Project[] = [
  SAMPLE_PROJECT,
  {
    id: "proj-2",
    name: "NFT Marketplace",
    description: "A smart contract for trading NFTs",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NFTMarketplace {
    // Basic NFT marketplace implementation
    // (stub for demonstration purposes)
}`,
    user_id: "user-1",
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  }
];

export default function DashboardPage() {
  const [user] = useState(MOCK_USER);
  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project | undefined>(SAMPLE_PROJECT);
  const [code, setCode] = useState(SAMPLE_PROJECT.code);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | undefined>();
  const { toast } = useToast();

  // Simulate saving code changes to active project
  const handleSaveCode = () => {
    if (activeProject) {
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
    }
  };

  // Handle creation of a new project
  const handleCreateProject = (name: string, description: string) => {
    const newProject: Project = {
      id: `proj-${projects.length + 1}`,
      name,
      description,
      code: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract ${name.replace(/\s+/g, '')} {\n    // Your code here\n}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setProjects(prev => [...prev, newProject]);
    setActiveProject(newProject);
    setCode(newProject.code);
    
    toast({
      title: "Project created",
      description: `${name} has been created successfully.`,
    });
  };

  // Simulate verification process
  const handleStartVerification = (level: VerificationLevel) => {
    // Create a new verification result
    const newResult: VerificationResult = {
      id: `verif-${Date.now()}`,
      project_id: activeProject?.id || "",
      level,
      status: VerificationStatus.RUNNING,
      results: [],
      logs: ["Initializing verification..."],
      created_at: new Date().toISOString(),
    };
    
    setVerificationResult(newResult);
    
    // Simulate verification steps with delays
    const steps = [
      "Parsing Solidity code...",
      "Analyzing contract structure...",
      "Running slither analysis...",
      "Checking for common vulnerabilities...",
      "Verifying arithmetic operations...",
      "Analyzing control flow...",
      "Checking reentrancy guards...",
      "Evaluating gas usage...",
      "Finalizing results..."
    ];
    
    // Sample issues based on the code (for demonstration)
    const sampleIssues: VerificationIssue[] = [
      {
        type: "warning",
        message: "Missing input validation: value parameter should be checked for potential overflow",
        location: { line: 26, column: 28 },
        code: "function transfer(address to, uint256 value) public returns (bool success) {",
        severity: "medium"
      },
      {
        type: "info",
        message: "Consider using SafeMath library for arithmetic operations",
        severity: "low"
      }
    ];
    
    // If we're using the medium level, add a more complex issue
    if (level === VerificationLevel.MEDIUM) {
      sampleIssues.push({
        type: "error",
        message: "Potential integer overflow in transferFrom function",
        location: { line: 42, column: 18 },
        code: "balanceOf[to] += value;",
        severity: "high"
      });
    }
    
    // Simulate the verification steps with delays
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setVerificationResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            logs: [...prev.logs, steps[stepIndex]],
          };
        });
        stepIndex++;
      } else {
        clearInterval(interval);
        
        // Complete the verification
        setVerificationResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: VerificationStatus.COMPLETED,
            results: sampleIssues,
            completed_at: new Date().toISOString(),
          };
        });
        
        toast({
          title: "Verification complete",
          description: `Found ${sampleIssues.length} issues.`,
        });
      }
    }, 1000);
  };

  useEffect(() => {
    if (activeProject) {
      setCode(activeProject.code);
      // Reset verification result when switching projects
      setVerificationResult(undefined);
    }
  }, [activeProject]);

  return (
    <div className="flex h-screen flex-col">
      <Navbar user={user} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          projects={projects} 
          activeProject={activeProject} 
          onSelectProject={setActiveProject}
          onCreateProject={handleCreateProject}
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
                <Button size="sm" onClick={handleSaveCode} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
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
                    
                    <TabsContent value="code" className="flex-1 rounded-md border p-0 overflow-hidden">
                      <MonacoEditor value={code} onChange={setCode} />
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div className="border-l overflow-auto p-4">
                  <VerificationPanel 
                    projectId={activeProject.id} 
                    code={code}
                    onVerify={handleStartVerification}
                    result={verificationResult}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">No project selected</h2>
                <p className="text-muted-foreground mb-4">
                  Select a project from the sidebar or create a new one.
                </p>
                <Button onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="Create project"]')?.click()}>
                  Create New Project
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
