
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserNav } from "@/components/layout/UserNav";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  hideUser?: boolean;
}

export function Navbar({ hideUser = false }: NavbarProps) {
  const { user } = useAuth();

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
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            {!hideUser && (
              user ? (
                <UserNav user={{ email: user.email || "", avatar_url: user.user_metadata?.avatar_url }} />
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link to="/auth?mode=login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth?mode=register">Sign Up</Link>
                  </Button>
                </div>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
