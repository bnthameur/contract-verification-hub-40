
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex gap-6 md:gap-10">
          <Link to="/" className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Formal
            </span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link to="#features" className="text-sm font-medium transition-colors hover:text-primary">
              Features
            </Link>
            <Link to="#security" className="text-sm font-medium transition-colors hover:text-primary">
              Security
            </Link>
            <Link to="#pricing" className="text-sm font-medium transition-colors hover:text-primary">
              Pricing
            </Link>
            <Link to="#docs" className="text-sm font-medium transition-colors hover:text-primary">
              Documentation
            </Link>
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth?mode=login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/auth?mode=register">Sign Up</Link>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
