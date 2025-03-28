
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

export function LightRay() {
  const { theme } = useTheme();
  
  return (
    <div 
      className="absolute top-0 left-0 right-0 pointer-events-none z-10 overflow-hidden h-20" 
      data-theme={theme} 
      data-chat-started="false"
    >
      <div className="ray ray-one"></div>
      <div className="ray ray-two"></div>
      <div className="ray ray-three"></div>
      <div className="ray ray-four"></div>
      <div className="ray ray-five"></div>
    </div>
  );
}
