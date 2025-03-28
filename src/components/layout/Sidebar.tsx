
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, FolderPlus, Search } from "lucide-react";
import { useState } from "react";
import { Project } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SidebarProps {
  projects: Project[];
  activeProject?: Project;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
}

export function Sidebar({ projects, activeProject, onSelectProject, onCreateProject }: SidebarProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="group w-64 border-r px-2 py-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-2 px-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Create project">
              <PlusCircle className="h-5 w-5 text-primary" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new Solidity project to verify.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                onCreateProject();
                setOpen(false);
              }}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="relative mb-4 px-2">
        <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <Separator className="my-2" />
      
      <ScrollArea className="flex-grow px-1">
        <div className="space-y-1 py-2">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Button
                key={project.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start font-normal",
                  project.id === activeProject?.id && "bg-accent text-accent-foreground"
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
      </ScrollArea>
    </div>
  );
}
