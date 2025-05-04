from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import os
import tempfile
import uuid
import json
import subprocess
import httpx
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import supabase
from datetime import datetime
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging
import venv
import sys


# Setup logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Smart Contract Verification API")

load_dotenv()
# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
DEEPSEEK_REASONER_URL = os.environ.get("DEEPSEEK_REASONER_URL")
DEEPSEEK_CHAT_URL = os.environ.get("DEEPSEEK_CHAT_URL")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")

# Validate essential environment variables
if not all([SUPABASE_URL, SUPABASE_KEY, DEEPSEEK_API_KEY]):
    logger.error("Missing essential environment variables")
    raise EnvironmentError("Missing essential environment variables. Check SUPABASE_URL, SUPABASE_KEY, and DEEPSEEK_API_KEY")

supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# Pydantic models for request/response validation
class VerificationRequest(BaseModel):
    project_id: str

class AIRequest(BaseModel):
    content: str
    prompt: str

class VerificationResponse(BaseModel):
    verification_id: str
    status: str
    message: str

# Helper functions
def get_smart_contract(project_id: str) -> Dict[str, Any]:
    """Fetch smart contract from Supabase database"""
    logger.info(f"Fetching smart contract with project_id: {project_id}")
    try:
        response = supabase_client.table("projects").select("*").eq("id", project_id).execute()
        
        if not response.data or len(response.data) == 0:
            logger.error(f"Project with ID {project_id} not found")
            raise HTTPException(status_code=404, detail=f"Project with ID {project_id} not found")
        
        logger.info(f"Successfully retrieved project {project_id}")
        return response.data[0]
    except Exception as e:
        logger.error(f"Error fetching smart contract: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching smart contract: {str(e)}")

def create_verification_record(project_id: str, level: str) -> str:
    """Create a verification record in the database and return its ID"""
    logger.info(f"Creating verification record for project {project_id} with level {level}")
    try:
        # Insert the record
        result = supabase_client.table("verification_results").insert({
            "project_id": project_id,
            "level": level,
            "status": "running",
            "created_at": datetime.now().isoformat()
        }).execute()
        
        # Extract the ID of the newly created record
        if result and result.data and len(result.data) > 0:
            verification_id = result.data[0]["id"]
            logger.info(f"Created verification record with ID: {verification_id}")
            return verification_id
        else:
            logger.error("Failed to create verification record, no data returned")
            raise Exception("Failed to create verification record")
            
    except Exception as e:
        logger.error(f"Error creating verification record: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating verification record: {str(e)}")


def update_verification_status(verification_id: str, status: str, results: Dict[str, Any], specs_draft: str = None, specs_used: str = None):
    """Update the verification record with results"""
    logger.info(f"Updating verification record {verification_id} with status {status}")
    
    # Handle results appropriately based on type
    results_issues = []
    logs = ["Verification started"]
    
    if isinstance(results, dict):
        if "results" in results:
            results_issues = results["results"]
        if "logs" in results:
            logs = results["logs"]
        if "error" in results:
            # Add the error to logs
            logs.append(f"Error: {results['error']}")
    
    # Ensure we have minimal logs even if none provided
    if not logs:
        logs = ["Verification started"]
        if status == "completed":
            logs.append("Verification completed")
        elif status == "failed":
            logs.append("Verification failed")
    
    update_data = {
        "status": status,
        "results": results_issues,
        "logs": logs,
        "completed_at": datetime.now().isoformat() if status in ["completed", "failed"] else None
    }
    
    if specs_draft:
        update_data["specs_draft"] = specs_draft

    if specs_used:
        update_data["specs_used"] = specs_used
    
    try:
        supabase_client.table("verification_results").update(update_data).eq("id", verification_id).execute()
        logger.info(f"Successfully updated verification record {verification_id}")
    except Exception as e:
        logger.error(f"Error updating verification record: {str(e)}")
        print(f"Error updating verification record: {str(e)}")

def run_slither_analysis(contract_file_path: str) -> Dict[str, Any]:
    """Run Slither analysis on the smart contract"""
    logger.info(f"Running Slither analysis on {contract_file_path}")
    try:
        result = subprocess.run(
            ["slither", contract_file_path, "--json", "-"],
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode != 0 and not result.stdout:
            logger.error(f"Slither analysis failed: {result.stderr}")
            return {"error": result.stderr}
        
        logger.info("Slither analysis completed successfully")
        return json.loads(result.stdout)
    except Exception as e:
        logger.error(f"Error running Slither: {str(e)}")
        return {"error": f"Error running Slither: {str(e)}"}

# In process_results_with_ai function, add a timeout parameter
def process_results_with_ai(content: str, prompt: str, mode: str = "chat", timeout=30):
    """Process content with DeepSeek's specific models"""
    logger.info(f"Processing results with AI using mode: {mode}")
    try:
        # Choose the appropriate endpoint
        url = DEEPSEEK_CHAT_URL if mode == "chat" else DEEPSEEK_REASONER_URL
        
        # Structure the request according to DeepSeek's API
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": content}
            ],
            "model": "deepseek-chat" if mode == "chat" else "deepseek-reasoner",
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        logger.info(f"Sending request to DeepSeek API: {url}")
        # Increase timeout here
        response = httpx.post(url, headers=headers, json=payload, timeout=timeout)
        response.raise_for_status()
        
        # Extract the AI response content
        ai_response = response.json()["choices"][0]["message"]["content"]
        logger.info("Successfully received AI response")
        return ai_response
        
    except Exception as e:
        logger.error(f"DeepSeek API Error: {str(e)}")
        return {"error": f"DeepSeek API Error: {str(e)}"}


class CertoraRunner:
    """A class to manage Certora Prover runs with a reusable virtual environment"""
    
    def __init__(self, certora_root: str = "."):
        """Initialize the CertoraRunner
        
        Args:
            certora_root: Path to the CertoraProver repository root
        """
        import os
        import sys
        import logging
        import tempfile
        import subprocess
        import venv
        
        self.logger = logging.getLogger(__name__)
        self.certora_root = os.path.abspath(certora_root)
        self.venv_dir = None
        self.python_path = None
        self.initialized = False
        
        # Create a persistent directory for the virtual environment
        venv_parent = os.path.join(tempfile.gettempdir(), "certora_venv")
        os.makedirs(venv_parent, exist_ok=True)
        self.venv_dir = os.path.join(venv_parent, ".venv")
        
        # Set paths based on platform
        if sys.platform == "win32":
            self.python_path = os.path.join(self.venv_dir, "Scripts", "python.exe")
        else:
            self.python_path = os.path.join(self.venv_dir, "bin", "python")
    
    def initialize(self):
        """Initialize the virtual environment if not already done"""
        import os
        import sys
        import venv
        import subprocess
        
        if self.initialized:
            return True
            
        try:
            # Check if virtual environment exists
            if not os.path.exists(self.venv_dir):
                self.logger.info(f"Creating virtual environment at {self.venv_dir}")
                venv.create(self.venv_dir, with_pip=True)
                
                # Get pip path based on platform
                if sys.platform == "win32":
                    pip_path = os.path.join(self.venv_dir, "Scripts", "pip.exe")
                else:
                    pip_path = os.path.join(self.venv_dir, "bin", "pip")
                
                # Install dependencies
                requirements_path = os.path.join(self.certora_root, "scripts", "certora_cli_requirements.txt")
                self.logger.info(f"Installing dependencies from {requirements_path}")
                result = subprocess.run(
                    [pip_path, "install", "-r", requirements_path],
                    check=True,
                    capture_output=True
                )
                
                if result.returncode != 0:
                    self.logger.error(f"Failed to install dependencies: {result.stderr}")
                    return False
            
            self.initialized = True
            return True
            
        except Exception as e:
            self.logger.error(f"Error initializing virtual environment: {str(e)}")
            return False
    
    def run_prover(self, contract_file_path: str, cvl_code: str) -> dict:
        """Run Certora Prover on the smart contract with CVL specs
        
        Args:
            contract_file_path: Path to the smart contract file
            cvl_code: CVL specifications as string
        
        Returns:
            Dictionary containing the results or error information
        """
        import tempfile
        import subprocess
        import json
        import os
        
        # Ensure virtual environment is initialized
        if not self.initialized and not self.initialize():
            return {"success": False, "error": "Failed to initialize virtual environment"}
        
        self.logger.info(f"Running Certora Prover on {contract_file_path}")
        
        cvl_path = None
        try:
            # Save CVL code to a temporary file
            with tempfile.NamedTemporaryFile(suffix=".spec", delete=False) as cvl_file:
                cvl_file.write(cvl_code.encode())
                cvl_path = cvl_file.name
            
            # Run Certora Prover
            self.logger.info("Executing Certora Prover...")
            result = subprocess.run(
                [
                    self.python_path, 
                    os.path.join(self.certora_root, "scripts", "certoraRun.py"), 
                    contract_file_path, 
                    "--spec", 
                    cvl_path, 
                    "--json"
                ],
                capture_output=True,
                text=True,
                check=False,
                cwd=self.certora_root  # Run from the repository root
            )
            
            # Clean up the temporary file
            if cvl_path and os.path.exists(cvl_path):
                os.unlink(cvl_path)
                cvl_path = None
            
            # Process the result
            if result.returncode != 0:
                self.logger.error(f"Certora Prover failed: {result.stderr}")
                return {"success": False, "error": result.stderr}
            
            self.logger.info("Certora Prover completed successfully")
            return json.loads(result.stdout) if result.stdout else {"success": True}
            
        except Exception as e:
            # Clean up if exception occurs
            if cvl_path and os.path.exists(cvl_path):
                os.unlink(cvl_path)
            self.logger.error(f"Error running Certora Prover: {str(e)}")
            return {"success": False, "error": str(e)}

# Simple function wrapper for backward compatibility
def run_certoraprover(contract_file_path: str, cvl_code: str, certora_root: str = ".") -> dict:
    """Run Certora Prover on the smart contract with CVL specs
    
    This is a wrapper around CertoraRunner that creates or reuses a virtual environment.
    
    Args:
        contract_file_path: Path to the smart contract file
        cvl_code: CVL specifications as string
        certora_root: Path to the CertoraProver repository root (default: current directory)
    
    Returns:
        Dictionary containing the results or error information
    """
    # Use a global runner to reuse the virtual environment
    global _certora_runner
    
    try:
        # Create runner if it doesn't exist
        if '_certora_runner' not in globals() or _certora_runner is None:
            _certora_runner = CertoraRunner(certora_root)
            
        # Run the prover using the existing runner
        return _certora_runner.run_prover(contract_file_path, cvl_code)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in run_certoraprover: {str(e)}")
        return {"success": False, "error": str(e)}
# Verification tasks
async def run_simple_verification(project_id: str, verification_id: str):
    logger.info(f"Starting simple verification for project {project_id}")
    try:
        # Create project-specific temp directory
        temp_dir = f"/tmp/verification_{verification_id}"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Update logs to show verification started
        update_verification_status(verification_id, "running", {"logs": ["Verification started", "Preparing environment"]})
        
        # Get smart contract
        project = get_smart_contract(project_id)
        contract_code = project.get("code", "")
        
        # Write contract to project temp directory
        contract_path = os.path.join(temp_dir, f"contract_{project_id}.sol")
        with open(contract_path, "w") as contract_file:
            contract_file.write(contract_code)
        
        logger.info(f"Contract saved to file: {contract_path}")
        
        # Update logs
        update_verification_status(verification_id, "running", {"logs": ["Verification started", "Preparing environment", "Analyzing contract"]})
        
        # Run Slither analysis
        slither_results = run_slither_analysis(contract_path)
        
        # Save slither results for debugging
        slither_output_path = os.path.join(temp_dir, "slither_results.json")
        with open(slither_output_path, "w") as slither_file:
            json.dump(slither_results, slither_file, indent=2)
        
        logger.info(f"Slither results saved to: {slither_output_path}")
        
        # Process results with AI
        logger.info("Processing Slither results with AI")
        ai_prompt = """You are a blockchain security analyst AI. I will give you the results from a Slither static analysis tool.
        Your task is to extract all relevant vulnerabilities and format them into a JSON structure that exactly matches this template for a Completed Simple Verification:

        {
        "results": [
            {
            "id": "issue-1",
            "type": "error | warning | info",
            "title": "Short summary",
            "description": "Detailed explanation",
            "line": [line number],
            "file": "[filename.sol]",
            "severity": "high | medium | low"
            },
            {
            "id": "issue-2",
            "type": "error | warning | info",
            "title": "Short summary",
            "description": "Detailed explanation",
            "line": [line number],
            "file": "[filename.sol]",
            "severity": "high | medium | low"
            }
        ],
        "logs": [
            "Verification started",
            "Preparing environment",
            "Analyzing contract",
            "Detecting vulnerabilities",
            "Found X issues",
            "Verification completed"
        ]
        }
        Replace all placeholders. Write realistic issue titles, descriptions, line numbers, and severity based on the actual Slither findings. Use standard naming conventions for issues (e.g., "Reentrancy vulnerability", "Unchecked return value", etc.). Do not include unrelated information. Your output should be a well-formed JSON object ready for insertion into Supabase."""
        
        # Increase timeout for AI processing
        processed_results = process_results_with_ai(json.dumps(slither_results), ai_prompt, "chat", timeout=60)
        
        # Save AI response for debugging
        ai_response_path = os.path.join(temp_dir, "ai_response_raw.txt")
        with open(ai_response_path, "w") as ai_file:
            if isinstance(processed_results, dict):
                json.dump(processed_results, ai_file, indent=2)
            else:
                ai_file.write(str(processed_results))
        
        logger.info(f"AI response saved to: {ai_response_path}")
        
        # Handle AI processing error
        if isinstance(processed_results, dict) and "error" in processed_results:
            logger.error(f"AI processing error: {processed_results['error']}")
            final_results = {
                "results": [],
                "logs": [
                    "Verification started", 
                    "Preparing environment", 
                    "Analyzing contract", 
                    "Slither analysis completed",
                    f"AI processing error: {processed_results['error']}",
                    "Verification completed with errors"
                ],
                "error": processed_results['error']
            }
        else:
            # Parse AI response with robust error handling
            try:
                # Try to clean and parse the response
                response_text = str(processed_results).strip()
                
                # Check if response is already a dict
                if isinstance(processed_results, dict):
                    final_results = processed_results
                else:
                    # Try to find JSON content if it's embedded in text
                    # Look for opening/closing braces
                    start_idx = response_text.find('{')
                    end_idx = response_text.rfind('}')
                    
                    if start_idx >= 0 and end_idx > start_idx:
                        json_str = response_text[start_idx:end_idx+1]
                        
                        # Save extracted JSON for debugging
                        extracted_json_path = os.path.join(temp_dir, "extracted_json.txt")
                        with open(extracted_json_path, "w") as json_file:
                            json_file.write(json_str)
                            
                        # Parse the extracted JSON
                        final_results = json.loads(json_str)
                    else:
                        # No valid JSON found
                        raise ValueError("No valid JSON structure found in AI response")
                
                # Validate minimal structure
                if not isinstance(final_results, dict):
                    raise ValueError("Parsed result is not a dictionary")
                
                if "results" not in final_results:
                    final_results["results"] = []
                
                if "logs" not in final_results:
                    final_results["logs"] = ["Verification started", "Preparing environment", "Analyzing contract", 
                                            "Detecting vulnerabilities", "Verification completed"]
            
            except Exception as parsing_error:
                logger.error(f"Error parsing AI response: {str(parsing_error)}")
                final_results = {
                    "results": [],
                    "logs": ["Verification started", "Preparing environment", "Analyzing contract", 
                            "Error processing results", "Verification completed with errors"],
                    "error": f"Failed to parse AI response: {str(parsing_error)}"
                }
                
                # Save the parsing error for debugging
                error_path = os.path.join(temp_dir, "parsing_error.txt")
                with open(error_path, "w") as error_file:
                    error_file.write(f"Error: {str(parsing_error)}\n\n")
                    error_file.write(f"Original AI response: {response_text}")
        
        # Save final processed results for debugging
        final_results_path = os.path.join(temp_dir, "final_results.json")
        with open(final_results_path, "w") as results_file:
            json.dump(final_results, results_file, indent=2)
            
        logger.info(f"Final results saved to: {final_results_path}")
        
        # Update verification record
        logger.info("Updating verification record with final results")
        update_verification_status(verification_id, "completed", final_results)
        
        # Add debug info to logs
        logger.info(f"Simple verification completed for project {project_id}. Debug files in {temp_dir}")
        
    except Exception as e:
        logger.error(f"Error in simple verification: {str(e)}")
        # Create error directory if it doesn't exist
        temp_dir = f"/tmp/verification_{verification_id}_error"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Save the error details
        error_path = os.path.join(temp_dir, "verification_error.txt")
        with open(error_path, "w") as error_file:
            error_file.write(f"Error: {str(e)}\n\n")
            import traceback
            error_file.write(traceback.format_exc())
        
        # Update verification record with error
        error_data = {
            "results": [],
            "logs": ["Verification started", "Error encountered", f"Error: {str(e)}", f"Debug info in {temp_dir}"],
            "error": str(e)
        }
        update_verification_status(verification_id, "failed", error_data) 


async def run_deep_verification(project_id: str, verification_id: str):
    """Background task to run deep verification with AI specification generation"""
    logger.info(f"Starting deep verification for project {project_id}")
    try:
        # Update logs to show verification started
        update_verification_status(verification_id, "running", {"logs": ["Deep verification initiated", "Generating formal specifications"]})
        
        # Get smart contract
        project = get_smart_contract(project_id)
        contract_code = project.get("code", "")
        
        # Write contract to temporary file
        with tempfile.NamedTemporaryFile(suffix=".sol", delete=False) as contract_file:
            contract_file.write(contract_code.encode())
            contract_path = contract_file.name
        
        logger.info(f"Contract saved to temporary file: {contract_path}")
        
        # Generate specifications with AI
        ai_prompt = """You are a smart contract security expert and formal verification specialist. I will send you a Solidity smart contract.
        Your task is to write complete and deep formal specifications in English, as if preparing them for translation into Certora's CVL (Certora Verification Language).

        Follow these rules:

        Cover all critical functions like transfer, mint, burn, withdraw, deposit, etc.

        Include invariants, access control, event emission, and edge cases.

        Use a formal yet human-readable tone, clear for developers and users to confirm before converting to CVL.

        Structure the output as a numbered list, like:

        1. The contract must ensure that balances do not go negative.
        2. Only the owner can call `setConfig`.
        3. On every `transfer`, the sum of balances must remain equal to the total supply.
        4. Function `withdraw` must update internal state before making external calls.
        Your output should deeply and precisely define how the contract should behave and what properties must always hold. Do not include unrelated information."""
        
        logger.info("Generating specifications with AI")
        specs_draft = process_results_with_ai(contract_code, ai_prompt, "reasoner")
        
        # Check if AI returned an error
        if isinstance(specs_draft, dict) and "error" in specs_draft:
            logger.error(f"Error generating specifications: {specs_draft['error']}")
            error_data = {
                "results": [],
                "logs": ["Deep verification initiated", "Error generating specifications", f"Error: {specs_draft['error']}"],
                "error": specs_draft['error']
            }
            update_verification_status(verification_id, "failed", error_data)
            return
            
        # Update record with draft specifications
        specs_update = {
            "results": [],
            "logs": ["Deep verification initiated", "Generating formal specifications", "Specifications generated", "Awaiting user confirmation"]
        }
        
        logger.info("Updating verification record with draft specifications")
        # Convert specs_draft to string if it's not already
        if not isinstance(specs_draft, str):
            specs_draft = json.dumps(specs_draft)
            
        update_verification_status(verification_id, "awaiting_confirmation", specs_update, specs_draft)
        
        # Clean up
        os.unlink(contract_path)
        logger.info(f"Deep verification awaiting confirmation for project {project_id}")
        
    except Exception as e:
        logger.error(f"Error in deep verification: {str(e)}")
        # Update verification record with error
        error_data = {
            "results": [],
            "logs": ["Deep verification initiated", "Error encountered", f"Error: {str(e)}"],
            "error": str(e)
        }
        update_verification_status(verification_id, "failed", error_data)

async def finalize_deep_verification(project_id: str, verification_id: str, approved_specs: str):
    """Background task to complete deep verification after user confirmation"""
    logger.info(f"Finalizing deep verification for project {project_id}")
    try:
        # Update logs to show verification continuing
        update_verification_status(verification_id, "processing", {
            "logs": ["Deep verification initiated", "Specifications confirmed by user", "Running formal verification"]
        })
        
        # Get smart contract
        project = get_smart_contract(project_id)
        contract_code = project.get("code", "")
        
        # Write contract to temporary file
        with tempfile.NamedTemporaryFile(suffix=".sol", delete=False) as contract_file:
            contract_file.write(contract_code.encode())
            contract_path = contract_file.name
        
        logger.info(f"Contract saved to temporary file: {contract_path}")
        
        # Generate CVL code from approved specifications
        ai_prompt = """You are an expert in writing formal specifications in Certora Verification Language (CVL). I will send you a confirmed list of functional and security specifications written in English. Your task is to translate them into correct and complete CVL code.

        Rules:
        Make sure to cover all logic from the English specs.
        Use invariant, rule, or function_spec as appropriate.
        Clearly name your invariants and rules.
        Follow Certora CVL best practices.
        """
        
        logger.info("Generating CVL code from approved specifications")
        cvl_response = process_results_with_ai(approved_specs, ai_prompt, "reasoner")
        
        # Check if AI returned an error
        if isinstance(cvl_response, dict) and "error" in cvl_response:
            logger.error(f"Error generating CVL code: {cvl_response['error']}")
            error_data = {
                "results": [],
                "logs": ["Deep verification initiated", "Specifications confirmed by user", "Error generating CVL code", f"Error: {cvl_response['error']}"],
                "error": cvl_response['error']
            }
            update_verification_status(verification_id, "failed", error_data)
            return
            
        # Extract CVL code
        cvl_code = cvl_response
        if isinstance(cvl_response, dict):
            cvl_code = cvl_response.get("content", "")
        
        # Run Certora Prover
        logger.info("Running Certora Prover with generated CVL code")
        certora_results = run_certoraprover(contract_path, cvl_code)
        
        # Process Certora results with AI
        ai_prompt = f"""You are a blockchain AI agent. I will give you the results from a Certora formal verification run. Your task is to reformat the results to match this JSON structure for a Completed Deep Verification:

        {{
        "results": [
            {{
            "id": "issue-1",
            "type": "error | warning | info",
            "title": "Summary of issue",
            "description": "Detailed explanation of the issue",
            "line": [approximate line in Contract.sol],
            "file": "[filename.sol]",
            "severity": "critical | high | medium | low"
            }}
        ],
        "logs": [
            "Deep verification initiated",
            "Generating formal specifications",
            "Specifications confirmed by user",
            "Running formal verification",
            "Analyzing contract properties",
            "Found X issues",
            "Verification completed"
        ]
        }}
        Your output must follow the structure and tone exactly. For line numbers, approximate based on error trace. Severity must be logically assessed (e.g., invariant violations = critical, gas tips = low)."""
        
        logger.info("Processing Certora results with AI")
        processed_response = process_results_with_ai(json.dumps(certora_results), ai_prompt, "chat")
        
        # Parse AI response
        try:
            if isinstance(processed_response, dict) and "error" in processed_response:
                final_results = processed_response
            else:
                # Try to parse the JSON string from AI
                try:
                    final_results = json.loads(processed_response)
                except json.JSONDecodeError:
                    final_results = {
                        "results": [],
                        "logs": ["Deep verification initiated", "Specifications confirmed by user", 
                                "Running formal verification", "Error processing results", 
                                "Verification completed with errors"],
                        "error": "Failed to parse AI response"
                    }
        except Exception as parsing_error:
            logger.error(f"Error parsing AI response: {str(parsing_error)}")
            final_results = {
                "results": [],
                "logs": ["Deep verification initiated", "Specifications confirmed by user", 
                        "Running formal verification", "Error processing results", 
                        "Verification completed with errors"],
                "error": str(parsing_error)
            }
        
        # Update verification record with final results
        logger.info("Updating verification record with final results")
        update_verification_status(verification_id, "completed", final_results, None, approved_specs)
        
        # Clean up
        os.unlink(contract_path)
        logger.info(f"Deep verification completed for project {project_id}")
        
    except Exception as e:
        logger.error(f"Error finalizing deep verification: {str(e)}")
        # Update verification record with error
        error_data = {
            "results": [],
            "logs": ["Deep verification initiated", "Specifications confirmed by user", "Error encountered", f"Error: {str(e)}"],
            "error": str(e)
        }
        update_verification_status(verification_id, "failed", error_data)

# API Endpoints
@app.post("/verify/simple", response_model=VerificationResponse)
async def verify_simple(request: VerificationRequest, background_tasks: BackgroundTasks):
    """Simple verification using Slither"""
    logger.info(f"Received simple verification request for project {request.project_id}")
    project_id = request.project_id
    
    # Create verification record
    verification_id = create_verification_record(project_id, "simple")
    
    # Start background task
    background_tasks.add_task(run_simple_verification, project_id, verification_id)
    
    logger.info(f"Simple verification task started for project {project_id} with verification ID {verification_id}")
    return VerificationResponse(
        verification_id=verification_id,
        status="running",
        message="Simple verification started"
    )

@app.post("/verify/deep", response_model=VerificationResponse)
async def verify_deep(request: VerificationRequest, background_tasks: BackgroundTasks):
    """Deep verification with AI-generated specifications"""
    logger.info(f"Received deep verification request for project {request.project_id}")
    project_id = request.project_id
    
    # Create verification record
    verification_id = create_verification_record(project_id, "deep")
    
    # Start background task
    background_tasks.add_task(run_deep_verification, project_id, verification_id)
    
    logger.info(f"Deep verification task started for project {project_id} with verification ID {verification_id}")
    return VerificationResponse(
        verification_id=verification_id,
        status="running",
        message="Deep verification started, awaiting specification generation"
    )

@app.post("/verify/confirm/{verification_id}", response_model=VerificationResponse)
async def confirm_specifications(verification_id: str, specifications: Dict[str, Any], background_tasks: BackgroundTasks):
    """Confirm and finalize deep verification with user-approved specifications"""
    logger.info(f"Received confirmation for verification ID {verification_id}")
    try:
        # Get verification record
        response = supabase_client.table("verification_results").select("*").eq("id", verification_id).execute()
        
        if not response.data or len(response.data) == 0:
            logger.error(f"Verification record with ID {verification_id} not found")
            raise HTTPException(status_code=404, detail=f"Verification record with ID {verification_id} not found")
        
        verification = response.data[0]
        
        if verification["status"] != "awaiting_confirmation":
            logger.error(f"Verification {verification_id} is not awaiting confirmation, current status: {verification['status']}")
            raise HTTPException(status_code=400, detail="This verification is not awaiting confirmation")
        
        # Update status
        supabase_client.table("verification_results").update({
            "status": "processing"
        }).eq("id", verification_id).execute()
        
        # Convert specifications to string if they're not already
        specs_str = specifications if isinstance(specifications, str) else json.dumps(specifications)
        
        # Start background task for finalization
        background_tasks.add_task(finalize_deep_verification, verification["project_id"], verification_id, specs_str)
        
        logger.info(f"Deep verification confirmation processing for ID {verification_id}")
        return VerificationResponse(
            verification_id=verification_id,
            status="processing",
            message="Deep verification processing with approved specifications"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming specifications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error confirming specifications: {str(e)}")

@app.get("/verification/{verification_id}")
async def get_verification_status(verification_id: str):
    """Get status of a verification job"""
    logger.info(f"Getting verification status for ID {verification_id}")
    try:
        response = supabase_client.table("verification_results").select("*").eq("id", verification_id).execute()
        
        if not response.data or len(response.data) == 0:
            logger.error(f"Verification record with ID {verification_id} not found")
            raise HTTPException(status_code=404, detail=f"Verification record with ID {verification_id} not found")
        
        logger.info(f"Successfully retrieved verification status for ID {verification_id}")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching verification status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching verification status: {str(e)}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust according to your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/")
def read_root():
    return {"message": "Smart Contract Verification API is running", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)