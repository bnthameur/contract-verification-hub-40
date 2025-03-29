import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { ShieldCheck, Code, FileCheck, Zap, Layers, ChevronRight, GithubIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";

export default function Index() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/20 dark:from-primary/10 dark:to-background z-0" />
            <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-[0.03] bg-repeat z-0" />
            
            <div className="container relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col space-y-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                  <div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Smart Contract Security
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                      Verify & Validate Your Solidity Contracts
                    </h1>
                    <p className="mt-6 text-xl text-muted-foreground max-w-xl">
                      A powerful verification platform that helps you identify vulnerabilities and errors in your Solidity smart contracts before deployment.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild size="lg" className="gap-1">
                      <Link to="/auth?mode=register">
                        Get Started
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/auth?mode=login">
                        Login
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Powered by <span className="font-medium">Slither</span> and <span className="font-medium">Z3 SMT Solver</span>
                  </div>
                </div>
                
                <div className="relative flex justify-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                  <div className="relative w-full max-w-lg">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-xl blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative rounded-xl overflow-hidden shadow-xl border border-white/10 backdrop-blur-sm">
                      <div className="flex items-center gap-2 px-4 py-2 bg-black/90 dark:bg-black/80">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-gray-400">VerifiableToken.sol</span>
                      </div>
                      <pre className="text-xs sm:text-sm text-left p-4 max-h-[400px] overflow-auto bg-zinc-900 dark:bg-black/90">
                        <code className="language-solidity text-white">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VerifiableToken {
    string public name = "Verifiable Token";
    string public symbol = "VTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value);
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool success) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(balanceOf[from] >= value);
        require(allowance[from][msg.sender] >= value);
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}`}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Features Section */}
          <section className="py-16 bg-secondary/50 dark:bg-secondary/10">
            <div className="container">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Powerful Verification Tools</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our platform combines industry-leading verification tools to provide comprehensive security analysis for your smart contracts.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard 
                  icon={<Code />} 
                  title="Code Analysis" 
                  description="Static analysis of your Solidity code to detect common vulnerabilities and coding errors."
                />
                <FeatureCard 
                  icon={<FileCheck />} 
                  title="Formal Verification" 
                  description="Mathematically prove the correctness of critical contract functions using Z3 SMT solver."
                />
                <FeatureCard 
                  icon={<Zap />} 
                  title="Real-time Feedback" 
                  description="Get immediate feedback as verification progresses with detailed logs and issue reports."
                />
                <FeatureCard 
                  icon={<Layers />} 
                  title="Project Management" 
                  description="Organize your contracts into projects and keep track of verification history."
                />
                <FeatureCard 
                  icon={<ShieldCheck />} 
                  title="Security Best Practices" 
                  description="Learn and apply security best practices with helpful suggestions and examples."
                />
                <FeatureCard 
                  icon={<GithubIcon />} 
                  title="Version Control" 
                  description="Track changes to your contracts over time and compare verification results between versions."
                />
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-16 md:py-24">
            <div className="container">
              <div className="rounded-xl overflow-hidden glass-panel">
                <div className="p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Smart Contracts?</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                    Start using our verification tools today and ensure your Solidity contracts are secure, reliable, and free from vulnerabilities.
                  </p>
                  <Button asChild size="lg">
                    <Link to="/auth?mode=register">
                      Create Your Free Account
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <footer className="bg-muted/50 py-8">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <ShieldCheck className="h-6 w-6 text-primary mr-2" />
                <span className="font-bold">Solidity Verifier</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Solidity Verifier. All rights reserved.
              </div>
              
              <div className="flex gap-4">
                <Button variant="ghost" size="sm">Terms</Button>
                <Button variant="ghost" size="sm">Privacy</Button>
                <Button variant="ghost" size="sm">Contact</Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-card p-6 rounded-xl transition-transform hover:translate-y-[-5px]">
      <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
