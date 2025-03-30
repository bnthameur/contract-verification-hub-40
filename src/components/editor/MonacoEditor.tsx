
import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { useTheme } from "@/hooks/use-theme";

// Setup Monaco Environment to work with web workers properly
self.MonacoEnvironment = {
  getWorkerUrl: function (_moduleId: string, label: string) {
    if (label === 'json') {
      return './json.worker.js';
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './css.worker.js';
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './html.worker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return './ts.worker.js';
    }
    return './editor.worker.js';
  }
};

// This is just a mock for the current example, in a real app we'd use actual Solidity syntax
const SOLIDITY_EXAMPLE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private storedData;
    
    function set(uint256 x) public {
        storedData = x;
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
}
`;

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

export function MonacoEditor({ value = SOLIDITY_EXAMPLE, onChange, height = "70vh" }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useTheme();
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Register Solidity language if not registered
  useEffect(() => {
    if (!monaco.languages.getLanguages().some(lang => lang.id === 'sol')) {
      monaco.languages.register({ id: 'sol' });
      
      // Basic Solidity tokenization rules - this is simplified
      monaco.languages.setMonarchTokensProvider('sol', {
        tokenizer: {
          root: [
            [/\/\/.*$/, 'comment'],
            [/\/\*/, 'comment', '@comment'],
            [/\b(contract|function|public|private|return|uint256|address|mapping|struct|enum|event|modifier|emit|require|revert|assert|if|else|for|while|do|break|continue|returns|view|pure|payable|external|internal|storage|memory|calldata|constant|immutable|library|interface|pragma|solidity|import|using|is|new|delete|this|var|let|const)\b/, 'keyword'],
            [/\b(true|false)\b/, 'boolean'],
            [/\b(0x[a-fA-F0-9]+)\b/, 'number.hex'],
            [/\b([0-9]+)\b/, 'number'],
            [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-terminated string
            [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
            [/[{}()\[\]]/, '@brackets'],
            [/[<>](?!@symbols)/, '@brackets'],
            [/[;,.]/, 'delimiter'],
          ],
          string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
          ],
          comment: [
            [/[^/*]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/[/*]/, 'comment']
          ],
        }
      });
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && !monacoRef.current) {
      // Setup editor
      monacoRef.current = monaco.editor.create(editorRef.current, {
        value,
        language: "sol",
        theme: theme === "dark" ? "vs-dark" : "vs-light",
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        roundedSelection: true,
        padding: { top: 16 },
        fontSize: 14,
        tabSize: 2,
        lineNumbers: "on",
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          useShadows: false,
          verticalHasArrows: false,
          horizontalHasArrows: false,
          verticalScrollbarSize: 16,
          horizontalScrollbarSize: 16
        }
      });

      // Register model change event
      monacoRef.current.onDidChangeModelContent(() => {
        onChange(monacoRef.current?.getValue() || "");
      });

      setIsEditorReady(true);
    }

    return () => {
      monacoRef.current?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current) {
      monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs-light");
    }
  }, [theme]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (monacoRef.current && isEditorReady && value !== monacoRef.current.getValue()) {
      monacoRef.current.setValue(value);
    }
  }, [value, isEditorReady]);

  return (
    <div 
      ref={editorRef} 
      className="editor-container rounded-md border border-border overflow-hidden"
      style={{ height }}
    />
  );
}
