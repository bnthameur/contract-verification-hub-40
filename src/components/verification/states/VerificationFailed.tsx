
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerificationFailedProps {
  onRetry: () => void;
  errorMessage?: string;
}

export function VerificationFailed({ onRetry, errorMessage }: VerificationFailedProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
      <h3 className="text-xl font-semibold mb-2">Verification Failed</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {errorMessage || "We encountered an error while verifying your contract. Please try again or contact support if the issue persists."}
      </p>
      <Button
        onClick={onRetry}
        className="mt-2"
      >
        Try Again
      </Button>
    </div>
  );
}
