import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Rocket, 
  Network, 
  Wallet, 
  Settings, 
  Fuel, 
  DollarSign,
  Copy,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeploymentPanelProps {
  contractCode: string;
  contractName?: string;
}

interface NetworkConfig {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: string;
  testnet: boolean;
}

const NETWORKS: NetworkConfig[] = [
  {
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: 'ETH',
    testnet: false
  },
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: 'ETH',
    testnet: true
  },
  {
    id: 'polygon',
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: 'MATIC',
    testnet: false
  },
  {
    id: 'mumbai',
    name: 'Mumbai Testnet',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: 'MATIC',
    testnet: true
  }
];

export function DeploymentPanel({ contractCode, contractName = 'Contract' }: DeploymentPanelProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('sepolia');
  const [constructorArgs, setConstructorArgs] = useState<string>('');
  const [gasLimit, setGasLimit] = useState<string>('3000000');
  const [gasPrice, setGasPrice] = useState<string>('20');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  
  const { toast } = useToast();

  const selectedNetworkConfig = NETWORKS.find(n => n.id === selectedNetwork);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard"
    });
  };

  const extractContractName = (code: string): string => {
    const match = code.match(/contract\s+(\w+)/);
    return match ? match[1] : contractName;
  };

  const parseConstructorParameters = (code: string): string[] => {
    const constructorMatch = code.match(/constructor\s*\([^)]*\)/);
    if (!constructorMatch) return [];
    
    const params = constructorMatch[0].match(/\((.*)\)/);
    if (!params || !params[1].trim()) return [];
    
    return params[1].split(',').map(p => p.trim().split(' ')[0]);
  };

  const handleDeploy = async () => {
    if (!selectedNetworkConfig) return;

    setIsDeploying(true);
    
    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock deployment result
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
      
      setDeploymentResult({
        transactionHash: mockTxHash,
        contractAddress: mockAddress,
        networkName: selectedNetworkConfig.name,
        explorerUrl: selectedNetworkConfig.explorerUrl
      });
      
      toast({
        title: "Deployment Successful!",
        description: `Contract deployed to ${selectedNetworkConfig.name}`
      });
      
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "There was an error deploying your contract",
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const detectedContractName = extractContractName(contractCode);
  const constructorParams = parseConstructorParameters(contractCode);

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Contract Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Contract Name</Label>
            <Input value={detectedContractName} readOnly />
          </div>
          
          {constructorParams.length > 0 && (
            <div>
              <Label>Constructor Parameters</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {constructorParams.map((param, index) => (
                  <Badge key={index} variant="secondary">{param}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Choose Network</Label>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    <div className="flex items-center gap-2">
                      {network.name}
                      {network.testnet && <Badge variant="outline" className="text-xs">Testnet</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedNetworkConfig && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chain ID:</span>
                <span>{selectedNetworkConfig.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span>{selectedNetworkConfig.nativeCurrency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Explorer:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(selectedNetworkConfig.explorerUrl, '_blank')}
                  className="h-auto p-1"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Deployment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {constructorParams.length > 0 && (
            <div>
              <Label>Constructor Arguments (JSON format)</Label>
              <Textarea
                placeholder='["arg1", "arg2", 123]'
                value={constructorArgs}
                onChange={(e) => setConstructorArgs(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Gas Limit</Label>
              <Input
                type="number"
                value={gasLimit}
                onChange={(e) => setGasLimit(e.target.value)}
              />
            </div>
            <div>
              <Label>Gas Price (Gwei)</Label>
              <Input
                type="number"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              <span>Estimated Cost: {((parseInt(gasLimit) * parseInt(gasPrice)) / 1e9).toFixed(6)} {selectedNetworkConfig?.nativeCurrency}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning for Mainnet */}
      {selectedNetworkConfig && !selectedNetworkConfig.testnet && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Mainnet Deployment Warning</span>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              You're about to deploy to a mainnet. This will cost real money and the deployment is irreversible.
              Make sure you've tested your contract thoroughly on a testnet first.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Deploy Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleDeploy}
            disabled={isDeploying || !contractCode.trim()}
            className="w-full"
            size="lg"
          >
            {isDeploying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Deploy Contract
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Deployment Result */}
      {deploymentResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Deployment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-green-700">Transaction Hash</Label>
              <div className="flex items-center gap-2">
                <Input value={deploymentResult.transactionHash} readOnly className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(deploymentResult.transactionHash)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-green-700">Contract Address</Label>
              <div className="flex items-center gap-2">
                <Input value={deploymentResult.contractAddress} readOnly className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(deploymentResult.contractAddress)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => window.open(`${deploymentResult.explorerUrl}/tx/${deploymentResult.transactionHash}`, '_blank')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on {deploymentResult.networkName} Explorer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
