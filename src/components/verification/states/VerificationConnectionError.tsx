
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface VerificationConnectionErrorProps {
  apiUrl: string;
  onRetry: () => void;
}

export function VerificationConnectionError({ apiUrl, onRetry }: VerificationConnectionErrorProps) {
  return (
    <div className="p-4">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Backend Disconnected</AlertTitle>
        <AlertDescription>
          <p className="mb-2">We're having trouble connecting to our backend verification services.</p>
          <ul className="list-disc list-inside text-sm">
            <li>Check if API URL is correctly configured: {apiUrl || "Not set"}</li>
            <li>Ensure your internet connection is stable</li>
            <li>The verification service may be temporarily unavailable</li>
          </ul>
        </AlertDescription>
      </Alert>
      <Button 
        onClick={onRetry}
        className="w-full mt-2"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry Connection
      </Button>
    </div>
  );
}
