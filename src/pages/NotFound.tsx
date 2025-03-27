
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <AlertCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild size="lg">
            <Link to="/">
              Return to Homepage
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
