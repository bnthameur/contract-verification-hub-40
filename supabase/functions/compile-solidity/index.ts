
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompileRequest {
  contractCode: string;
  contractName?: string;
  projectId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contractCode, contractName, projectId }: CompileRequest = await req.json()

    if (!contractCode) {
      return new Response(
        JSON.stringify({ error: 'Contract code is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create a temporary Solidity file
    const tempFileName = `Contract_${Date.now()}.sol`
    const tempFilePath = `/tmp/${tempFileName}`
    
    await Deno.writeTextFile(tempFilePath, contractCode)

    // Compile using solc (Solidity compiler)
    // You'll need to install solc in your Edge Function environment
    const compileCommand = new Deno.Command("solc", {
      args: [
        "--combined-json", "abi,bin,bin-runtime",
        "--optimize",
        tempFilePath
      ]
    })

    const { code, stdout, stderr } = await compileCommand.output()
    
    if (code !== 0) {
      const errorOutput = new TextDecoder().decode(stderr)
      return new Response(
        JSON.stringify({ 
          error: 'Compilation failed', 
          details: errorOutput 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    const output = new TextDecoder().decode(stdout)
    const compilationResult = JSON.parse(output)
    
    // Extract the first contract from compilation result
    const contracts = compilationResult.contracts
    const contractKey = Object.keys(contracts)[0]
    const contract = contracts[contractKey]

    const result = {
      abi: JSON.parse(contract.abi),
      bytecode: '0x' + contract.bin,
      contractName: contractName || contractKey.split(':')[1],
      constructorInputs: JSON.parse(contract.abi).filter((item: any) => item.type === 'constructor')[0]?.inputs || []
    }

    // Clean up temp file
    try {
      await Deno.remove(tempFilePath)
    } catch (e) {
      console.warn('Could not remove temp file:', e)
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
