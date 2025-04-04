
import { Button } from "@/components/ui/button";
import { MarketingNavbar } from "@/components/layout/MarketingNavbar";
import { 
  ShieldCheck, Code, FileCheck, Zap, Layers, 
  ChevronRight, GithubIcon, CheckCircle, LockIcon,
  Users, Workflow, BarChart, Terminal, Puzzle
} from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";

export default function Index() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <MarketingNavbar />
        
        <main className="flex-1">
          {/* Hero Section with Gradient Background */}
          <section className="relative overflow-hidden py-24 md:py-32">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/10 to-background z-0" />
            <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-[0.03] bg-repeat z-0" />
            
            {/* Animated Background Elements */}
            <div className="absolute top-20 right-[10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 left-[10%] w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
            
            <div className="container relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col space-y-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                  <div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Smart Contract Security
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                      Secure Your Smart Contracts Before Deployment
                    </h1>
                    <p className="mt-6 text-xl text-muted-foreground max-w-xl">
                      Our powerful verification platform identifies vulnerabilities and errors in Solidity smart contracts,
                      backed by industry-leading tools and formal verification methods.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild size="lg" className="gap-1 group">
                      <Link to="/auth?mode=register">
                        Get Started
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/auth?mode=login">
                        Sign In
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
                      Secure by Design
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
                      Trusted by Experts
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
                      Open Source Tools
                    </div>
                  </div>
                </div>
                
                <div className="relative flex justify-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                  <div className="relative w-full max-w-lg">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-xl blur-lg opacity-70 animate-pulse"></div>
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
          
          {/* Security Threats Section */}
          <section className="py-16 bg-muted/30">
            <div className="container">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Common Smart Contract Vulnerabilities</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our platform helps you identify and fix these critical security issues before deployment
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <SecurityThreatCard 
                  icon={<LockIcon />}
                  title="Reentrancy Attacks" 
                  description="Malicious contracts can call back into your contract before state updates are finalized."
                  impact="high"
                />
                <SecurityThreatCard 
                  icon={<Users />}
                  title="Access Control Issues" 
                  description="Improper authorization allowing unauthorized users to execute sensitive functions."
                  impact="high"
                />
                <SecurityThreatCard 
                  icon={<Terminal />}
                  title="Integer Overflow/Underflow" 
                  description="Arithmetic operations that exceed variable size limits can cause unexpected behavior."
                  impact="medium"
                />
                <SecurityThreatCard 
                  icon={<Workflow />}
                  title="Front-Running" 
                  description="Attackers can observe pending transactions and insert their own first to gain advantage."
                  impact="medium"
                />
                <SecurityThreatCard 
                  icon={<BarChart />}
                  title="Gas Limitations" 
                  description="Functions that consume too much gas can become unusable or vulnerable to DoS attacks."
                  impact="medium"
                />
                <SecurityThreatCard 
                  icon={<Puzzle />}
                  title="Logic Errors" 
                  description="Flawed contract logic that leads to unexpected behavior or financial loss."
                  impact="high"
                />
              </div>
            </div>
          </section>
          
          {/* Features Section with Animated Cards */}
          <section id="features" className="py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background"></div>
            <div className="container relative z-10">
              <div className="text-center mb-16">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
                  <Layers className="h-4 w-4 mr-2" />
                  Comprehensive Tools
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Powerful Verification Platform</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Our suite of tools helps you build more secure smart contracts
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard 
                  icon={<Code />} 
                  title="Static Analysis" 
                  description="Scans your code automatically to detect common vulnerabilities and coding errors without execution."
                  delay={0.1}
                />
                <FeatureCard 
                  icon={<FileCheck />} 
                  title="Formal Verification" 
                  description="Mathematically proves the correctness of your contract's critical functions using Z3 SMT solver."
                  delay={0.2}
                />
                <FeatureCard 
                  icon={<Zap />} 
                  title="Real-time Feedback" 
                  description="Get immediate feedback as verification progresses with detailed logs and issue reports."
                  delay={0.3}
                />
                <FeatureCard 
                  icon={<Layers />} 
                  title="Project Management" 
                  description="Organize your contracts into projects and track verification history across multiple versions."
                  delay={0.4}
                />
                <FeatureCard 
                  icon={<ShieldCheck />} 
                  title="Best Practices" 
                  description="Learn and apply security best practices with helpful suggestions and remediation hints."
                  delay={0.5}
                />
                <FeatureCard 
                  icon={<GithubIcon />} 
                  title="Version Control" 
                  description="Track changes to your contracts over time and compare verification results between versions."
                  delay={0.6}
                />
              </div>
            </div>
          </section>
          
          {/* How It Works Section */}
          <section className="py-20 bg-muted/30">
            <div className="container">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our verification platform makes it easy to secure your smart contracts
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                <div className="bg-card rounded-lg p-6 border relative">
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">1</div>
                  <h3 className="text-xl font-semibold mb-3 mt-2">Upload Your Contract</h3>
                  <p className="text-muted-foreground">
                    Simply paste your Solidity code or upload a .sol file to get started. Our system supports all major Solidity versions.
                  </p>
                </div>
                
                <div className="bg-card rounded-lg p-6 border relative">
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">2</div>
                  <h3 className="text-xl font-semibold mb-3 mt-2">Run Verification</h3>
                  <p className="text-muted-foreground">
                    Select your preferred verification level, from basic static analysis to advanced formal verification.
                  </p>
                </div>
                
                <div className="bg-card rounded-lg p-6 border relative">
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">3</div>
                  <h3 className="text-xl font-semibold mb-3 mt-2">Review & Fix</h3>
                  <p className="text-muted-foreground">
                    Receive detailed reports highlighting issues with suggested fixes and navigate directly to problem areas in your code.
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 z-0" />
            
            <div className="container relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Secure Your Smart Contracts?</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Start using our verification tools today and ensure your Solidity contracts are secure, reliable, and free from vulnerabilities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="px-8">
                    <Link to="/auth?mode=register">
                      Create Free Account
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="#features">
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <footer className="bg-muted py-12">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">FormalBase</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Secure your smart contracts with our powerful verification tools.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Platform</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Features</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Security</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Pricing</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Documentation</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Blog</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Tutorials</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Knowledge Base</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Community</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Company</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-muted-foreground hover:text-primary">About Us</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Careers</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Contact</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} FormalBase. All rights reserved.
              </div>
              
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div 
      className="glass-card p-6 rounded-xl transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

interface SecurityThreatCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

function SecurityThreatCard({ icon, title, description, impact }: SecurityThreatCardProps) {
  return (
    <div className="bg-card border rounded-lg p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${
          impact === 'high' ? 'bg-red-500/10 text-red-500' :
          impact === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
          'bg-blue-500/10 text-blue-500'
        }`}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{title}</h3>
            <Badge variant={
              impact === 'high' ? 'destructive' :
              impact === 'medium' ? 'default' :
              'secondary'
            }>
              {impact}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
