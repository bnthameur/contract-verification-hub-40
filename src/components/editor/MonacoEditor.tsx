
import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { useTheme } from "@/hooks/use-theme";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

// Setup Monaco Environment to work with web workers properly
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
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

// Solidity keywords and built-in types for syntax highlighting and autocompletion
const SOLIDITY_KEYWORDS = [
  'pragma', 'solidity', 'contract', 'library', 'interface', 'function', 'event', 'modifier',
  'constructor', 'public', 'private', 'internal', 'external', 'view', 'pure', 'payable',
  'virtual', 'override', 'returns', 'return', 'if', 'else', 'for', 'while', 'do', 'break',
  'continue', 'throw', 'emit', 'assembly', 'require', 'revert', 'assert', 'memory', 'storage',
  'calldata', 'constant', 'immutable', 'import', 'using', 'struct', 'enum', 'mapping', 'is', 'new',
  'delete', 'try', 'catch', 'this', 'super', 'type'
];

const SOLIDITY_TYPES = [
  'address', 'bool', 'string', 'bytes', 'bytes1', 'bytes2', 'bytes3', 'bytes4', 'bytes5',
  'bytes6', 'bytes7', 'bytes8', 'bytes9', 'bytes10', 'bytes11', 'bytes12', 'bytes13',
  'bytes14', 'bytes15', 'bytes16', 'bytes17', 'bytes18', 'bytes19', 'bytes20', 'bytes21',
  'bytes22', 'bytes23', 'bytes24', 'bytes25', 'bytes26', 'bytes27', 'bytes28', 'bytes29',
  'bytes30', 'bytes31', 'bytes32', 'int', 'int8', 'int16', 'int24', 'int32', 'int40',
  'int48', 'int56', 'int64', 'int72', 'int80', 'int88', 'int96', 'int104', 'int112',
  'int120', 'int128', 'int136', 'int144', 'int152', 'int160', 'int168', 'int176', 'int184',
  'int192', 'int200', 'int208', 'int216', 'int224', 'int232', 'int240', 'int248', 'int256',
  'uint', 'uint8', 'uint16', 'uint24', 'uint32', 'uint40', 'uint48', 'uint56', 'uint64', 
  'uint72', 'uint80', 'uint88', 'uint96', 'uint104', 'uint112', 'uint120', 'uint128', 
  'uint136', 'uint144', 'uint152', 'uint160', 'uint168', 'uint176', 'uint184', 'uint192', 
  'uint200', 'uint208', 'uint216', 'uint224', 'uint232', 'uint240', 'uint248', 'uint256',
  'fixed', 'ufixed', 'wei', 'gwei', 'ether', 'seconds', 'minutes', 'hours', 'days', 'weeks'
];

// Common Solidity snippets for autocompletion
const SOLIDITY_SNIPPETS = [
  {
    label: 'contract',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'contract ${1:Name} {\n\t$0\n}',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Contract definition'
  },
  {
    label: 'function',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'function ${1:name}(${2:params}) ${3:visibility} ${4:modifiers} returns (${5:return type}) {\n\t$0\n}',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Function definition'
  },
  {
    label: 'constructor',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'constructor(${1:params}) ${2:visibility} {\n\t$0\n}',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Constructor definition'
  },
  {
    label: 'event',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'event ${1:Name}(${2:params});',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Event definition'
  },
  {
    label: 'modifier',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'modifier ${1:name}(${2:params}) {\n\t_;\n\t$0\n}',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Modifier definition'
  },
  {
    label: 'require',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'require(${1:condition}, "${2:error message}");',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Require statement'
  },
  {
    label: 'mapping',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'mapping(${1:key} => ${2:value}) ${3:visibility} ${4:name};',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Mapping definition'
  },
  {
    label: 'struct',
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: 'struct ${1:Name} {\n\t${2:type} ${3:name};\n\t$0\n}',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Struct definition'
  }
];

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
      
      // Enhanced Solidity tokenization rules
      monaco.languages.setMonarchTokensProvider('sol', {
        tokenizer: {
          root: [
            [/\/\/.*$/, 'comment'],
            [/\/\*/, 'comment', '@comment'],
            [new RegExp(`\\b(${SOLIDITY_KEYWORDS.join('|')})\\b`), 'keyword'],
            [new RegExp(`\\b(${SOLIDITY_TYPES.join('|')})\\b`), 'type'],
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
      
      // Register Solidity completion provider
      monaco.languages.registerCompletionItemProvider('sol', {
        provideCompletionItems: (model, position) => {
          const suggestions = [
            ...SOLIDITY_KEYWORDS.map(keyword => ({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword
            })),
            ...SOLIDITY_TYPES.map(type => ({
              label: type,
              kind: monaco.languages.CompletionItemKind.TypeParameter,
              insertText: type
            })),
            ...SOLIDITY_SNIPPETS
          ];
          
          return {
            suggestions
          };
        }
      });
      
      // Add basic hover provider
      monaco.languages.registerHoverProvider('sol', {
        provideHover: (model, position) => {
          const word = model.getWordAtPosition(position);
          if (!word) return null;
          
          const keyword = SOLIDITY_KEYWORDS.find(k => k === word.word);
          const type = SOLIDITY_TYPES.find(t => t === word.word);
          
          let contents = [];
          
          if (keyword) {
            contents.push({ value: `**${keyword}** - Solidity keyword` });
          } else if (type) {
            contents.push({ value: `**${type}** - Solidity type` });
            
            // Add additional info for common types
            if (type.startsWith('uint')) {
              contents.push({ value: 'Unsigned integer type' });
              if (type !== 'uint') {
                const bits = type.replace('uint', '');
                contents.push({ value: `${bits} bits unsigned integer` });
              } else {
                contents.push({ value: 'Alias for uint256' });
              }
            } else if (type.startsWith('int')) {
              contents.push({ value: 'Signed integer type' });
              if (type !== 'int') {
                const bits = type.replace('int', '');
                contents.push({ value: `${bits} bits signed integer` });
              } else {
                contents.push({ value: 'Alias for int256' });
              }
            } else if (type === 'address') {
              contents.push({ value: '20 byte Ethereum address type' });
            } else if (type === 'bool') {
              contents.push({ value: 'Boolean value (true or false)' });
            } else if (type.startsWith('bytes')) {
              if (type === 'bytes') {
                contents.push({ value: 'Dynamic byte array' });
              } else {
                const size = type.replace('bytes', '');
                contents.push({ value: `Fixed byte array of ${size} bytes` });
              }
            }
          }
          
          return contents.length > 0 ? { contents } : null;
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
        wordWrap: "on",
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        formatOnType: true,
        formatOnPaste: true,
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
