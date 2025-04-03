
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import json
from datetime import datetime
from supabase import create_client
import re

app = FastAPI(title="FormalBase API", description="Smart Contract Verification API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

class ContractRequest(BaseModel):
    code: str
    project_id: str

def parse_slither_output(output: str):
    """Parse Slither output into structured issues"""
    issues = []
    
    # Pattern to match issues in Slither output
    issue_pattern = re.compile(
        r'([A-Za-z0-9_\- ]+):.*?'  # Issue type
        r'(high|medium|low|informational)'  # Severity
        r'.*?'
        r'Contract: ([A-Za-z0-9_]+)'  # Contract name
        r'.*?'
        r'(\.sol#L(\d+))?'  # File and line number (optional)
    , re.DOTALL | re.MULTILINE)
    
    matches = issue_pattern.findall(output)
    
    for i, match in enumerate(matches):
        issue_type, severity, contract, file_line, line_number = match
        
        # Extract the code snippet if available
        code_snippet = None
        if line_number:
            # In a real implementation, you would extract the relevant code line
            code_snippet = f"// Code at line {line_number}"
        
        issue = {
            "id": str(i + 1),
            "type": "warning" if severity in ["medium", "low"] else "error" if severity == "high" else "info",
            "message": issue_type.strip(),
            "severity": severity,
            "contract": contract,
            "code": code_snippet,
            "location": {"line": int(line_number) if line_number else None, "column": 1}
        }
        issues.append(issue)
    
    return issues or [
        {
            "id": "default",
            "type": "info",
            "message": "No specific issues found, but review output for details",
            "severity": "informational",
            "code": None
        }
    ]

def run_slither_analysis(contract_code: str, project_id: str):
    """Run Slither on contract code and parse results"""
    file_path = f"/tmp/{project_id}.sol"

    try:
        # Save contract code temporarily
        with open(file_path, "w") as f:
            f.write(contract_code)

        # Run Slither on the contract
        # Note: In production, add proper command sanitization
        result = subprocess.run(
            ["slither", file_path, "--json", f"/tmp/{project_id}.json"],
            capture_output=True,
            text=True
        )
        
        # Check if the JSON output file exists
        json_path = f"/tmp/{project_id}.json"
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                try:
                    slither_json = json.load(f)
                    # Clean up
                    os.remove(json_path)
                    
                    # Parse the JSON output
                    parsed_issues = []
                    for detector in slither_json.get("results", {}).get("detectors", []):
                        for result in detector.get("results", []):
                            issue = {
                                "type": "error" if detector["impact"] == "High" else 
                                       "warning" if detector["impact"] in ["Medium", "Low"] else "info",
                                "message": result.get("description", ""),
                                "severity": detector["impact"].lower(),
                                "code": result.get("code", None),
                                "location": {
                                    "line": result.get("source_mapping", {}).get("lines", [None])[0],
                                    "column": 1
                                }
                            }
                            parsed_issues.append(issue)
                    return parsed_issues, result.stdout + result.stderr
                except json.JSONDecodeError:
                    # If JSON parsing fails, fall back to text output processing
                    pass
        
        # Text-based fallback
        parsed_issues = parse_slither_output(result.stdout + result.stderr)
        return parsed_issues, result.stdout + result.stderr
    
    except Exception as e:
        return [{"type": "error", "message": f"Analysis error: {str(e)}", "severity": "high"}], str(e)
    finally:
        # Clean up
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/analyze")
async def analyze_contract(request: ContractRequest):
    try:
        # 1. Run Slither analysis
        issues, logs_text = run_slither_analysis(request.code, request.project_id)
        
        # 2. Convert logs to array format
        logs = logs_text.split("\n")
        
        # 3. Save verification result to Supabase
        verification_result = {
            "project_id": request.project_id,
            "level": "simple",  # Using simple level for Slither analysis
            "status": "completed",
            "results": issues,
            "logs": logs,
            "created_at": datetime.utcnow().isoformat(),
            "completed_at": datetime.utcnow().isoformat()
        }
        
        # Insert result into verification_results table
        result = supabase.table("verification_results").insert(verification_result).execute()
        
        return {
            "message": "Analysis completed",
            "result_id": result.data[0]["id"] if result.data else None,
            "issues_count": len(issues),
            "issues": issues
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/results/{project_id}")
async def get_results(project_id: str):
    try:
        response = supabase.table("verification_results").select("*").eq("project_id", project_id).order("created_at", {"ascending": False}).execute()
        
        if not response.data:
            return {"message": "No results found for this project"}
        
        return {"results": response.data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve results: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
