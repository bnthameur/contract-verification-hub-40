
import { ReactNode } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface ResizableLayoutProps {
  sidebarContent: ReactNode;
  mainContent: ReactNode;
  verificationContent: ReactNode;
  defaultSidebarSize?: number;
  defaultMainSize?: number;
  defaultVerificationSize?: number;
}

export function ResizableLayout({
  sidebarContent,
  mainContent,
  verificationContent,
  defaultSidebarSize = 15,
  defaultMainSize = 55,
  defaultVerificationSize = 30,
}: ResizableLayoutProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-[calc(100vh-4rem)]"
    >
<<<<<<< HEAD
      <div className="w-auto border-r overflow-auto">
        {sidebarContent}
      </div>
            
=======
      
        {sidebarContent}
    
      
      
>>>>>>> 263820cf15f81e461251b718b2d58692e1c7f758
      <ResizablePanel defaultSize={defaultMainSize} minSize={30}>
        {mainContent}
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel 
        defaultSize={defaultVerificationSize} 
        minSize={20} 
        maxSize={50}
        className="border-l"
      >
        {verificationContent}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
