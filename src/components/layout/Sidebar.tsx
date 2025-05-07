
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, FolderPlus, Search, MoreHorizontal, Edit, Trash, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Project } from "@/types";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarProps {
  projects: Project[];
  activeProject?: Project;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onRefreshProjects?: () => void;
}

export function Sidebar({ 
  projects, 
  activeProject, 
  onSelectProject, 
  onCreateProject,
  onRefreshProjects 
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const { toast } = useToast();

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setNewName(project.name);
    setNewDescription(project.description || "");
    setEditDialogOpen(true);
  };

  const handleSaveProjectEdit = async () => {
    if (!projectToEdit) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: newName,
          description: newDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectToEdit.id);

      if (error) throw error;

      toast({
        title: "Project updated",
        description: "Project details have been updated successfully."
      });
      
      setEditDialogOpen(false);
      
      // Refresh projects list
      if (onRefreshProjects) {
        onRefreshProjects();
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully."
      });
      
      // Refresh projects list
      if (onRefreshProjects) {
        onRefreshProjects();
      }
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className={cn(
      "group flex flex-col h-full bg-background border-r transition-all duration-300",
      collapsed ? "w-[60px]" : "w-[240px]"
    )}>
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <h2 className="text-lg font-semibold">Projects</h2>
        )}
        <div className="flex items-center">
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Create project"
              onClick={onCreateProject}
            >
              <PlusCircle className="h-5 w-5 text-primary" />
            </Button>
          )}
          <Button
            variant="ghost" 
            size="icon" 
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
            className="mr-2-2 transition-all duration-300 group-hover:opacity-100"
          >
            {collapsed ? <ChevronRight className="h-4 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {!collapsed && (
        <>
          <div className="relative px-4 mb-4">
            <Search className="absolute left-6 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Separator className="my-2" />
        </>
      )}
      
      <ScrollArea className="flex-grow px-2 overflow-y-auto">
        {collapsed ? (
          <div className="flex flex-col items-center py-4 space-y-4">
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Create project"
              onClick={onCreateProject}
            >
              <PlusCircle className="h-5 w-5 text-primary" />
            </Button>
            {filteredProjects.length > 0 && filteredProjects.map((project) => (
              <Button
                key={project.id}
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-md",
                  project.id === activeProject?.id ? "bg-accent" : "hover:bg-muted"
                )}
                onClick={() => onSelectProject(project)}
                title={project.name}
              >
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {project.name.charAt(0).toUpperCase()}
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className={cn(
                    "flex justify-between items-center rounded-md",
                    project.id === activeProject?.id ? "bg-accent" : "hover:bg-muted"
                  )}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal px-4 py-2 h-auto",
                      project.id === activeProject?.id && "text-accent-foreground"
                    )}
                    onClick={() => onSelectProject(project)}
                  >
                    <div className="flex flex-col items-start">
                      <div className="text-sm font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditProject(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive" 
                        onClick={() => handleDeleteProject(project)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : search ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No projects found
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <FolderPlus className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first project to get started
                </p>
                <Button 
                  onClick={onCreateProject}
                  className="gap-1.5"
                >
                  <PlusCircle className="h-4 w-4" />
                  New Project
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input 
                id="edit-name" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea 
                id="edit-description" 
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProjectEdit} disabled={!newName.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
