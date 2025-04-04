from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import json
from datetime import datetime
from supabase import create_client
import re
from typing import List, Dict, Any, Optional, Union

app = FastAPI(title="FormalBase API", description="Smart Contract Verification API")

# Get allowed origins from environment variable or use defaults
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "https://58efc0c8-52f0-4b94-abcc-024e3f64d36c.lovableproject.com,http://localhost:8080")
origins = [origin.strip() for origin in allowed_origins.split(",")]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

class ContractRequest(BaseModel):
    code: str
    project_id: str
    auth_token: Optional[str] = None

class ProcessedIssue(BaseModel):
    error_type: str
    severity: str
    description: str
    line_number: Optional[int] = None
    column_number: Optional[int] = 1
    function_name: Optional[str] = None
    contract_name: Optional[str] = None
    suggested_fix: Optional[str] = None
    code_snippet: Optional[str] = None

def get_severity_from_impact(impact: str) -> str:
    """Convert Slither impact to severity level"""
    impact_lower = impact.lower() if impact else ""
    if impact_lower == "high":
        return "high"
    elif impact_lower == "medium":
        return "medium"
    else:
        return "low"

def get_suggested_fix(description: str, detector_name: str) -> str:
    """Generate a suggested fix based on the issue type"""
    # Common fixes for known Slither detectors
    fixes = {
        "reentrancy": "Implement checks-effects-interactions pattern or use a reentrancy guard.",
        "uninitialized": "Initialize all state variables in the constructor.",
        "pragma": "Use a stable pragma statement with a specific version.",
        "solc-version": "Update to a more recent Solidity compiler version.",
        "unchecked-transfer": "Check the return value of token transfers.",
        "unchecked-call": "Add proper error handling for external calls.",
        "tx-origin": "Use msg.sender instead of tx.origin for authentication.",
        "assembly": "Only use assembly when necessary and document the code carefully.",
        "multiple-constructors": "Remove duplicate constructors and consolidate initialization logic.",
        "delegatecall": "Be extremely careful with delegatecall as it preserves context.",
        "suicidal": "Remove selfdestruct functionality or add strong access controls.",
        "unused-state": "Remove unused state variables to save gas.",
        "wrong-equality": "Use strict equality checks (== vs ===) appropriately.",
    }
    
    for key, fix in fixes.items():
        if key in detector_name.lower() or key in description.lower():
            return fix
    
    return "Review the code carefully and follow Solidity security best practices."

def extract_function_from_description(description: str) -> Optional[str]:
    """Extract function name from description if possible"""
    function_patterns = [
        r"Function\s+`([^`]+)`",
        r"function\s+([a-zA-Z0-9_]+)"
    ]
    
    for pattern in function_patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None

def extract_contract_from_description(description: str) -> Optional[str]:
    """Extract contract name from description if possible"""
    contract_patterns = [
        r"Contract\s+`([^`]+)`",
        r"contract\s+([a-zA-Z0-9_]+)"
    ]
    
    for pattern in contract_patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None

def extract_code_snippet(code: str, line_number: int) -> Optional[str]:
    """Extract code snippet around the error line"""
    if not code or not line_number:
        return None
        
    lines = code.strip().split('\n')
    
    # Make sure line_number is valid
    if line_number <= 0 or line_number > len(lines):
        return None
    
    # Extract 3 lines before and after the error line
    start = max(0, line_number - 3)
    end = min(len(lines), line_number + 2)
    
    result = []
    for i in range(start, end):
        line_prefix = "→ " if i+1 == line_number else "  "
        result.append(f"{i+1}: {line_prefix}{lines[i]}")
    
    return "\n".join(result)

def process_slither_json(slither_json: Dict[Any, Any], original_code: str) -> List[ProcessedIssue]:
    """Process Slither JSON into structured issue format"""
    processed_issues = []
    
    if not slither_json or "results" not in slither_json:
        return processed_issues
    
    detectors = slither_json.get("results", {}).get("detectors", [])
    
    for detector in detectors:
        detector_name = detector.get("check", "unknown")
        impact = detector.get("impact", "Low")
        severity = get_severity_from_impact(impact)
        
        for result in detector.get("results", []):
            description = result.get("description", "")
            
            # Extract line numbers from source mappings
            line_number = None
            if "source_mapping" in result and "lines" in result["source_mapping"]:
                lines = result["source_mapping"]["lines"]
                if lines and len(lines) > 0:
                    line_number = lines[0]
            
            # Extract function and contract names
            function_name = extract_function_from_description(description)
            contract_name = extract_contract_from_description(description)
            
            # Get code snippet if we have a line number
            code_snippet = extract_code_snippet(original_code, line_number) if line_number else None
            
            # Generate a suggested fix
            suggested_fix = get_suggested_fix(description, detector_name)
            
            issue = ProcessedIssue(
                error_type=detector_name,
                severity=severity,
                description=description,
                line_number=line_number,
                column_number=1,  # Default as Slither doesn't provide column info
                function_name=function_name,
                contract_name=contract_name,
                suggested_fix=suggested_fix,
                code_snippet=code_snippet
            )
            
            processed_issues.append(issue)
    
    return processed_issues

def process_slither_text_output(output_text: str, original_code: str) -> List[ProcessedIssue]:
    """Process Slither text output when JSON parsing fails"""
    processed_issues = []
    
    # Pattern to detect issues in Slither output
    pattern = r'(\[([a-zA-Z0-9_\-]+)\]\s+)?(.*?)(?:\(([^)]+)\))?\n\s+([^\n]+)'
    matches = re.finditer(pattern, output_text, re.MULTILINE)
    
    for match in matches:
        detector_name = match.group(2) or "unknown"
        title = match.group(3).strip() if match.group(3) else "Unknown issue"
        location = match.group(4) or ""
        description = match.group(5).strip() if match.group(5) else ""
        
        # Extract line number from location
        line_number = None
        line_match = re.search(r'#(\d+)', location)
        if line_match:
            line_number = int(line_match.group(1))
        
        # Determine severity based on detector name and description
        severity = "medium"  # Default
        if "high" in detector_name.lower() or "critical" in detector_name.lower():
            severity = "high"
        elif "low" in detector_name.lower() or "informational" in detector_name.lower():
            severity = "low"
        
        # Extract contract and function if available
        contract_name = None
        function_name = None
        
        contract_match = re.search(r'Contract: ([a-zA-Z0-9_]+)', description)
        if contract_match:
            contract_name = contract_match.group(1)
            
        function_match = re.search(r'Function: ([a-zA-Z0-9_]+)', description)
        if function_match:
            function_name = function_match.group(1)
        
        # Get code snippet if we have a line number
        code_snippet = extract_code_snippet(original_code, line_number) if line_number else None
        
        # Generate a suggested fix
        suggested_fix = get_suggested_fix(description, detector_name)
        
        full_description = f"{title}\n{description}"
        
        issue = ProcessedIssue(
            error_type=detector_name,
            severity=severity,
            description=full_description,
            line_number=line_number,
            column_number=1,  # Default
            function_name=function_name,
            contract_name=contract_name,
            suggested_fix=suggested_fix,
            code_snippet=code_snippet
        )
        
        processed_issues.append(issue)
    
    return processed_issues

def run_slither_analysis(contract_code: str, project_id: str) -> tuple[List[ProcessedIssue], str]:
    """Run Slither on contract code and parse results"""
    file_path = f"/tmp/{project_id}.sol"

    try:
        # Save contract code temporarily
        with open(file_path, "w") as f:
            f.write(contract_code)

        # Run Slither on the contract
        result = subprocess.run(
            ["slither", file_path, "--json", f"/tmp/{project_id}.json"],
            capture_output=True,
            text=True
        )
        
        logs = result.stdout + result.stderr
        
        # Check if the JSON output file exists
        json_path = f"/tmp/{project_id}.json"
        if os.path.exists(json_path):
            try:
                with open(json_path, 'r') as f:
                    slither_json = json.load(f)
                
                # Process the JSON output
                processed_issues = process_slither_json(slither_json, contract_code)
                
                # If no issues found through JSON, try processing text output
                if not processed_issues:
                    processed_issues = process_slither_text_output(logs, contract_code)
                
                return processed_issues, logs
            except json.JSONDecodeError:
                # Fall back to text processing if JSON is invalid
                processed_issues = process_slither_text_output(logs, contract_code)
                return processed_issues, logs
            finally:
                # Clean up JSON file
                if os.path.exists(json_path):
                    os.remove(json_path)
        
        # If no JSON file was created, process text output
        processed_issues = process_slither_text_output(logs, contract_code)
        return processed_issues, logs
    
    except Exception as e:
        error_msg = str(e)
        return [], error_msg
    finally:
        # Clean up
        if os.path.exists(file_path):
            os.remove(file_path)

def get_user_id_from_token(token: str) -> Optional[str]:
    """Get user_id from Supabase JWT token"""
    try:
        # This is a simplified version - in production, you'd verify the JWT properly
        response = supabase.auth.get_user(token)
        return response.user.id if response and response.user else None
    except Exception as e:
        print(f"Error getting user from token: {e}")
        return None

@app.post("/analyze")
async def analyze_contract(request: ContractRequest, authorization: Optional[str] = Header(None)):
    try:
        # Extract token from request or Authorization header
        auth_token = request.auth_token or (authorization.replace('Bearer ', '') if authorization else None)
        
        # 1. Run Slither analysis
        processed_issues, logs_text = run_slither_analysis(request.code, request.project_id)
        
        # 2. Convert logs to array format
        logs = logs_text.split("\n")
        
        # 3. Prepare simplified version for older clients
        simplified_issues = []
        for issue in processed_issues:
            simplified_issues.append({
                "type": "error" if issue.severity == "high" else "warning" if issue.severity == "medium" else "info",
                "message": issue.description,
                "severity": issue.severity,
                "location": {
                    "line": issue.line_number,
                    "column": issue.column_number
                },
                "code": issue.code_snippet
            })
        
        # 4. Save verification result to Supabase
        verification_result = {
            "project_id": request.project_id,
            "level": "simple",  # Using simple level for Slither analysis
            "status": "completed",
            "results": simplified_issues,  # Backward compatibility
            "structured_results": [issue.dict() for issue in processed_issues],  # New structured format
            "logs": logs,
            "created_at": datetime.utcnow().isoformat(),
            "completed_at": datetime.utcnow().isoformat()
        }
        
        # Insert result into verification_results table
        verification_insert = supabase.table("verification_results").insert(verification_result).execute()
        
        if not verification_insert.data:
            raise HTTPException(status_code=500, detail="Failed to insert verification result")
        
        verification_id = verification_insert.data[0]["id"]
        
        # 5. Store detailed issues in the verification_issues table
        for issue in processed_issues:
            issue_data = {
                "verification_id": verification_id,
                "error_type": issue.error_type,
                "severity": issue.severity,
                "description": issue.description,
                "line_number": issue.line_number,
                "column_number": issue.column_number,
                "function_name": issue.function_name,
                "contract_name": issue.contract_name,
                "suggested_fix": issue.suggested_fix,
                "code_snippet": issue.code_snippet,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Insert issue into verification_issues table
            supabase.table("verification_issues").insert(issue_data).execute()
        
        return {
            "message": "Analysis completed",
            "result_id": verification_id,
            "issues_count": len(processed_issues),
            "issues": simplified_issues  # Return simplified format for backward compatibility
        }
        
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "running", "message": "FormalBase API is operational"}

@app.get("/results/{project_id}")
async def get_results(project_id: str, authorization: Optional[str] = Header(None)):
    try:
        # Extract token from Authorization header if available
        auth_token = authorization.replace('Bearer ', '') if authorization else None
        
        # Verify user has access to this project if token is provided
        if auth_token:
            user_id = get_user_id_from_token(auth_token)
            if user_id:
                # Check if user owns this project
                project_check = supabase.table("projects").select("id").eq("id", project_id).eq("user_id", user_id).execute()
                if not project_check.data:
                    raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Get verification results
        response = supabase.table("verification_results").select("*").eq("project_id", project_id).order("created_at", {"ascending": False}).execute()
        
        if not response.data:
            return {"message": "No results found for this project"}
        
        enhanced_results = []
        
        for result in response.data:
            # Get detailed issues for this verification result
            issues_response = supabase.rpc("get_verification_issues", {"v_result_id": result["id"]}).execute()
            
            # Add detailed issues to the result
            result["detailed_issues"] = issues_response.data if issues_response.data else []
            enhanced_results.append(result)
        
        return {"results": enhanced_results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve results: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
