
import { useState, useEffect } from 'react';
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
  projectId?: string;
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

interface CompilationResult {
  abi: any[];
  bytecode: string;
  contractName: string;
  constructorInputs: any[];
}

interface WalletState {
  isConnected: boolean;
  address: string;
  chainId: number;
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

export function DeploymentPanel({ contractCode, contractName = 'Contract', projectId }: DeploymentPanelProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('sepolia');
  const [constructorArgs, setConstructorArgs] = useState<string>('');
  const [gasLimit, setGasLimit] = useState<string>('3000000');
  const [gasPrice, setGasPrice] = useState<string>('20');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: '',
    chainId: 0
  });
  
  const { toast } = useToast();

  const selectedNetworkConfig = NETWORKS.find(n => n.id === selectedNetwork);

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
    
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum === 'undefined') return;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (accounts.length > 0) {
        setWalletState({
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(chainId, 16)
        });
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setWalletState({ isConnected: false, address: '', chainId: 0 });
    } else {
      setWalletState(prev => ({ ...prev, address: accounts[0], isConnected: true }));
    }
  };

  const handleChainChanged = (chainId: string) => {
    setWalletState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet.",
        variant: "destructive"
      });
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      setWalletState({
        isConnected: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16)
      });
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to wallet",
        variant: "destructive"
      });
    }
  };

  const switchNetwork = async (network: NetworkConfig) => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Network not added to wallet, add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${network.chainId.toString(16)}`,
              chainName: network.name,
              nativeCurrency: {
                name: network.nativeCurrency,
                symbol: network.nativeCurrency,
                decimals: 18,
              },
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.explorerUrl],
            }],
          });
        } catch (addError) {
          toast({
            title: "Network Addition Failed",
            description: "Failed to add network to wallet",
            variant: "destructive"
          });
        }
      }
    }
  };

  const compileContract = async () => {
    if (!contractCode.trim()) {
      toast({
        title: "No Contract Code",
        description: "Please provide contract code to compile",
        variant: "destructive"
      });
      return;
    }

    setIsCompiling(true);
    
    try {
      // For now, we'll simulate compilation
      // In a real implementation, you'd call your Supabase Edge Function
      console.log('Compiling contract code:', contractCode);
      console.log('Project ID:', projectId);
      
      // Simulate compilation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock compilation result - replace with actual compilation
      const mockResult: CompilationResult = {
        abi: [
          {
            "inputs": [{"internalType": "string", "name": "_greeting", "type": "string"}],
            "stateMutability": "nonpayable",
            "type": "constructor"
          },
          {
            "inputs": [],
            "name": "greet",
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        bytecode: "0x608060405234801561001057600080fd5b506040516103e83803806103e8833981810160405281019061003291906100a6565b80600090805190602001906100489291906100fe565b5050610185565b600061006361005e8461012e565b610109565b81815260208101905060208101905083811115610083576100826101e7565b5b8080518352602060020a820416600180831161009e5761009d6101e7565b5b50505092915050565b6000602082840312156100bd576100bc6101f1565b5b600082015167ffffffffffffffff8111156100db576100da6101ec565b5b6100e784828501610050565b91505092915050565b6000819050919050565b6000819050919050565b600061011f61011a610115846100f0565b6100fa565b6100f0565b9050919050565b61012f81610104565b82525050565b600061014082610159565b61014a8185610164565b935061015a818560208601610175565b610163816101f6565b840191505092915050565b600081519050919050565b600082825260208201905092915050565b60005b838110156101a8578082015181840152602081019050610191565b838111156101b7576000848401525b50505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b610254806102146000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063cfae321714610030575b600080fd5b61003861004e565b6040516100459190610102565b60405180910390f35b60606000805461005d90610153565b80601f016020809104026020016040519081016040528092919081815260200182805461008990610153565b80156100d65780601f106100ab576101008083540402835291602001916100d6565b820191906000526020600020905b8154815290600101906020018083116100b957829003601f168201915b5050505050905090565b600081519050919050565b600082825260208201905092915050565b60005b8381101561011a5780820151818401526020810190506100ff565b83811115610129576000848401525b50505050565b6000601f19601f8301169050919050565b600061014b826100e0565b61015581856100eb565b93506101658185602086016100fc565b61016e8161012f565b840191505092915050565b6000602082019050818103600083015261019381846101d7565b905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806101e357607f821691505b602082108114156101f7576101f661019b565b5b5091905056fea2646970667358221220a8c8a8c8a8c8a8c8a8c8a8c8a8c8a8c8a8c8a8c8a8c8a8c8a8c8a8c8a8c864736f6c63430008070033",
        contractName: extractContractName(contractCode),
        constructorInputs: parseConstructorParameters(contractCode)
      };
      
      setCompilationResult(mockResult);
      
      toast({
        title: "Compilation Successful",
        description: `Contract ${mockResult.contractName} compiled successfully`
      });
      
    } catch (error: any) {
      console.error('Compilation error:', error);
      toast({
        title: "Compilation Failed",
        description: error.message || "Failed to compile contract",
        variant: "destructive"
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDeploy = async () => {
    if (!selectedNetworkConfig) return;
    
    if (!walletState.isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!compilationResult) {
      toast({
        title: "Contract Not Compiled",
        description: "Please compile the contract first",
        variant: "destructive"
      });
      return;
    }

    // Check if we're on the correct network
    if (walletState.chainId !== selectedNetworkConfig.chainId) {
      await switchNetwork(selectedNetworkConfig);
      return; // Let user try again after network switch
    }

    setIsDeploying(true);

    try {
      // Import ethers dynamically to avoid bundle size issues
      const { ethers } = await import('ethers');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Parse constructor arguments
      let args: any[] = [];
      if (constructorArgs.trim()) {
        try {
          args = JSON.parse(constructorArgs);
        } catch (e) {
          throw new Error('Invalid constructor arguments. Must be valid JSON array.');
        }
      }

      // Create contract factory
      const factory = new ethers.ContractFactory(
        compilationResult.abi,
        compilationResult.bytecode,
        signer
      );

      console.log(`Deploying ${compilationResult.contractName} with args:`, args);

      // Deploy with gas options
      const deploymentOptions: any = {};
      if (gasLimit) deploymentOptions.gasLimit = gasLimit;
      if (gasPrice) deploymentOptions.gasPrice = ethers.parseUnits(gasPrice, 'gwei');

      const contract = await factory.deploy(...args, deploymentOptions);
      
      toast({
        title: "Deployment Submitted",
        description: "Waiting for transaction confirmation..."
      });

      // Wait for deployment
      const receipt = await contract.deploymentTransaction()?.wait();
      const contractAddress = await contract.getAddress();

      setDeploymentResult({
        transactionHash: receipt?.hash,
        contractAddress,
        networkName: selectedNetworkConfig.name,
        explorerUrl: selectedNetworkConfig.explorerUrl,
        blockNumber: receipt?.blockNumber
      });

      toast({
        title: "Deployment Successful!",
        description: `Contract deployed at ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`
      });

    } catch (error: any) {
      console.error('Deployment error:', error);
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy contract",
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };

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

  const parseConstructorParameters = (code: string): any[] => {
    const constructorMatch = code.match(/constructor\s*\([^)]*\)/);
    if (!constructorMatch) return [];
    
    const params = constructorMatch[0].match(/\((.*)\)/);
    if (!params || !params[1].trim()) return [];
    
    return params[1].split(',').map(p => {
      const parts = p.trim().split(' ');
      return {
        type: parts[0],
        name: parts[1] || 'param'
      };
    });
  };

  const getCodePreview = (code: string): string => {
    const lines = code.split('\n');
    return lines.slice(0, 15).join('\n') + (lines.length > 15 ? '\n...' : '');
  };

  const detectedContractName = extractContractName(contractCode);
  const constructorParams = parseConstructorParameters(contractCode);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 pb-20">
        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!walletState.isConnected ? (
              <Button onClick={connectWallet} className="w-full">
                Connect Wallet
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Address:</span>
                  <Badge variant="outline" className="font-mono">
                    {walletState.address.slice(0, 6)}...{walletState.address.slice(-4)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Chain ID:</span>
                  <Badge variant={walletState.chainId === selectedNetworkConfig?.chainId ? "success" : "warning"}>
                    {walletState.chainId}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Overview */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Contract Overview
              {projectId && (
                <Badge variant="outline" className="text-xs">
                  Project: {projectId.slice(0, 8)}...
                </Badge>
              )}
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
                          <Badge key={index} variant="secondary" className="text-xs">
                            {param.type} {param.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={compileContract} 
                      disabled={isCompiling || !contractCode.trim()}
                      size="sm"
                      variant={compilationResult ? "success" : "default"}
                    >
                      {isCompiling ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                          Compiling...
                        </>
                      ) : compilationResult ? (
                        <>
                          <Fuel className="h-3 w-3 mr-2" />
                          Compiled ✓
                        </>
                      ) : (
                        <>
                          <Fuel className="h-3 w-3 mr-2" />
                          Compile Contract
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Contract Code Preview */}
              <div className="relative">
                <div className="w-32 h-24 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20 p-2 cursor-pointer group transition-all hover:border-primary/50 hover:bg-muted/70">
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

        {/* Compilation Result */}
        {compilationResult && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                Compilation Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Contract:</span>
                  <span className="font-medium ml-2">{compilationResult.contractName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ABI Functions:</span>
                  <span className="font-medium ml-2">{compilationResult.abi.length}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Bytecode Size:</span>
                <span className="font-medium ml-2 text-sm">{compilationResult.bytecode.length / 2} bytes</span>
              </div>
            </CardContent>
          </Card>
        )}

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
                  placeholder={`Enter arguments as JSON array: ${constructorParams.map(p => `"${p.name}"`).join(', ')}`}
                  value={constructorArgs}
                  onChange={(e) => setConstructorArgs(e.target.value)}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Expected: {constructorParams.map(p => `${p.type} ${p.name}`).join(', ')}
                </div>
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
              disabled={isDeploying || !compilationResult || !walletState.isConnected}
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

              {deploymentResult.blockNumber && (
                <div>
                  <Label className="text-green-700 font-medium">Block Number</Label>
                  <p className="text-sm font-mono">{deploymentResult.blockNumber}</p>
                </div>
              )}

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
