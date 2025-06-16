
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Rocket, 
  Network, 
  Wallet, 
  Settings, 
  Fuel, 
  DollarSign,
  Copy,
  ExternalLink,
  AlertTriangle,
  Edit,
  FileCode,
  Eye
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
  const [showContractPreview, setShowContractPreview] = useState(false);
  
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

  const getCodePreview = (code: string): string => {
    const lines = code.split('\n');
    return lines.slice(0, 15).join('\n') + (lines.length > 15 ? '\n...' : '');
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
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Contract Overview */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Contract Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Contract Name</Label>
                    <p className="text-lg font-semibold text-primary">{detectedContractName}</p>
                  </div>
                  
                  {constructorParams.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Constructor Parameters</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {constructorParams.map((param, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{param}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Contract Code Preview */}
              <div className="relative">
                <div 
                  className="w-32 h-24 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20 p-2 cursor-pointer group transition-all hover:border-primary/50 hover:bg-muted/70"
                  onClick={() => setShowContractPreview(!showContractPreview)}
                >
                  <div className="text-xs font-mono text-muted-foreground/60 leading-tight overflow-hidden">
                    {getCodePreview(contractCode)}
                  </div>
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-center">
                      <Edit className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <span className="text-xs text-primary font-medium">Edit Code</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Deployment Network</Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((network) => (
                    <SelectItem key={network.id} value={network.id}>
                      <div className="flex items-center gap-2">
                        {network.name}
                        {network.testnet && (
                          <Badge variant="outline" className="text-xs">Testnet</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedNetworkConfig && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chain ID:</span>
                    <span className="font-medium">{selectedNetworkConfig.chainId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span className="font-medium">{selectedNetworkConfig.nativeCurrency}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Block Explorer:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(selectedNetworkConfig.explorerUrl, '_blank')}
                    className="h-auto p-1 gap-1"
                  >
                    <span className="text-xs">{selectedNetworkConfig.explorerUrl.replace('https://', '')}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deployment Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Deployment Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {constructorParams.length > 0 && (
              <div>
                <Label>Constructor Arguments</Label>
                <Textarea
                  placeholder='Enter constructor arguments in JSON format: ["arg1", "arg2", 123]'
                  value={constructorArgs}
                  onChange={(e) => setConstructorArgs(e.target.value)}
                  className="font-mono text-sm"
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

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-2">
                <DollarSign className="h-4 w-4" />
                Gas Estimation
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {((parseInt(gasLimit) * parseInt(gasPrice)) / 1e9).toFixed(6)} {selectedNetworkConfig?.nativeCurrency}
              </div>
              <p className="text-xs text-blue-600 mt-1">Estimated deployment cost</p>
            </div>
          </CardContent>
        </Card>

        {/* Mainnet Warning */}
        {selectedNetworkConfig && !selectedNetworkConfig.testnet && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Mainnet Deployment</h4>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    You're deploying to a live network with real cryptocurrency. This action is irreversible and will cost real money. 
                    Ensure your contract has been thoroughly tested on a testnet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deploy Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleDeploy}
              disabled={isDeploying || !contractCode.trim()}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isDeploying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Deploying Contract...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5 mr-2" />
                  Deploy to {selectedNetworkConfig?.name}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Deployment Result */}
        {deploymentResult && (
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                Deployment Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-green-700 font-medium">Transaction Hash</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={deploymentResult.transactionHash} 
                    readOnly 
                    className="font-mono text-xs bg-white/50" 
                  />
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
                <Label className="text-green-700 font-medium">Contract Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={deploymentResult.contractAddress} 
                    readOnly 
                    className="font-mono text-xs bg-white/50" 
                  />
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
    </ScrollArea>
  );
}
