
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface VerificationConnectionErrorProps {
  apiUrl?: string;
  onRetry: () => void;
}

export function VerificationConnectionError({ apiUrl, onRetry }: VerificationConnectionErrorProps) {
  return (
    <div className="p-6 space-y-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>
          <p className="mb-2">We're having trouble connecting to our backend verification services.</p>
          <ul className="list-disc list-inside text-sm">
            <li>API URL is configured as: <span className="font-mono">{apiUrl || "Not set"}</span></li>
            <li>Make sure your backend server is running at this address</li>
            <li>Check if the /ping endpoint is implemented on your backend server</li>
            <li>Ensure CORS is properly configured on your backend</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <div className="border p-4 rounded-md bg-card/50">
        <h3 className="text-lg font-medium mb-2">Troubleshooting Steps</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Verify that your backend server is running at <span className="font-mono">{apiUrl || "Missing URL"}</span></li>
          <li>Check if the server has the correct endpoints implemented:
            <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
              <li><code>/ping</code> - Health check endpoint</li>
              <li><code>/verify/simple</code> - Simple verification endpoint</li>
              <li><code>/verify/deep</code> - Deep verification endpoint</li>
              <li><code>/verify/confirm/{"{verification_id}"}</code> - Confirmation endpoint</li>
            </ul>
          </li>
          <li>Check network logs in the browser console for more details on any connection errors</li>
        </ol>
      </div>
      
      <div className="flex justify-center">
        <Button onClick={onRetry} className="mt-4">
          Retry Connection
        </Button>
      </div>
    </div>
  );
}
