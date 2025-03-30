
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode, Upload } from "lucide-react";

interface ProjectCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (name: string, description: string, code?: string) => void;
  onFileUpload?: (file: File) => void;
}

export function ProjectCreationDialog({ 
  open, 
  onOpenChange, 
  onCreateProject,
  onFileUpload 
}: ProjectCreationDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (name.trim()) {
      onCreateProject(name, description);
      resetForm();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.sol') && onFileUpload) {
      onFileUpload(file);
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setActiveTab("create");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new Solidity project to verify.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 w-full">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input 
                id="name" 
                placeholder="My Smart Contract" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                placeholder="A brief description of your project"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Solidity File (.sol)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  accept=".sol"
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Upload a Solidity (.sol) file to create a new project
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          {activeTab === "create" && (
            <Button onClick={handleCreate} disabled={!name.trim()}>Create Project</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
