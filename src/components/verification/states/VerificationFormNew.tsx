
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VerificationFormNewProps {
  verificationLevel: string;
  onVerificationLevelChange: (level: string) => void;
  onVerify: (level: string) => Promise<void>;
  onCancel: () => void;
  isDisabled: boolean;
}

export function VerificationFormNew({
  verificationLevel,
  onVerificationLevelChange,
  onVerify,
  onCancel,
  isDisabled
}: VerificationFormNewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">Start New Verification</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Select a verification level to analyze your smart contract for issues and vulnerabilities.
      </p>
      <div className="space-y-4 w-full max-w-sm">
        <div className="space-y-2">
          <Select 
            value={verificationLevel} 
            onValueChange={onVerificationLevelChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select verification level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple Verification</SelectItem>
              <SelectItem value="deep">Deep Verification</SelectItem>
              <SelectItem value="advanced" disabled>Advanced Verification (Coming Soon)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {verificationLevel === "simple" && "Quick analysis to detect common vulnerabilities"}
            {verificationLevel === "deep" && "AI-powered formal verification with logic validation"}
            {verificationLevel === "advanced" && "Advanced formal verification with custom properties"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onVerify(verificationLevel)}
            disabled={isDisabled}
            className="flex-1"
          >
            Start Verification
          </Button>
        </div>
      </div>
    </div>
  );
}
