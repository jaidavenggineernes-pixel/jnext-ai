"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Send, Bot, Loader2, Play, Copy, Download, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type Message = { id: string; role: "user" | "assistant"; content: string };

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative group my-4 rounded-lg overflow-hidden bg-[#1e1e1e] border border-glass-border/20">
        <div className="flex items-center justify-between px-4 py-2 bg-black/40 text-xs text-muted-foreground border-b border-white/5">
          <span>{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors p-1"
            title="Copy code"
          >
            {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {isCopied ? "Copied!" : "Copy"}
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    );
  }
  return (
    <code className={`${className} bg-white/10 px-1.5 py-0.5 rounded-md text-sm`} {...props}>
      {children}
    </code>
  );
};

export default function CodingAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am your AI Coding Assistant. Describe what you want to build, and I will write the code for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [code, setCode] = useState<string>('// Your code will appear here...\n\nfunction helloWorld() {\n  console.log("Hello, JNext!");\n}');
  const [language, setLanguage] = useState("javascript");

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) throw new Error("Failed to connect to API");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let assistantMessage = "";
      const assistantId = (Date.now() + 1).toString();
      
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const textChunk = JSON.parse(line.substring(2));
              assistantMessage += textChunk;
              setMessages((prev) => prev.map(msg => 
                msg.id === assistantId ? { ...msg, content: assistantMessage } : msg
              ));

              // Extract any code block to update the code editor live
              if (assistantMessage.includes("```")) {
                const codeMatch = assistantMessage.match(/```(?:\w+)?\n([\s\S]*?)(?:```|$)/);
                if (codeMatch && codeMatch[1]) {
                  setCode(codeMatch[1]);
                }
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          } else if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const dataObj = JSON.parse(line.substring(6));
              if (dataObj.type === 'text-delta' && dataObj.delta) {
                assistantMessage += dataObj.delta;
                setMessages((prev) => prev.map(msg => 
                  msg.id === assistantId ? { ...msg, content: assistantMessage } : msg
                ));

                // Extract any code block to update the code editor live
                if (assistantMessage.includes("```")) {
                  const codeMatch = assistantMessage.match(/```(?:\w+)?\n([\s\S]*?)(?:```|$)/);
                  if (codeMatch && codeMatch[1]) {
                    setCode(codeMatch[1]);
                  }
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [...prev, { 
        id: Date.now().toString(), 
        role: "assistant", 
        content: `⚠️ **System Error:** Jaringan API sibuk atau kuota Google Gemini Anda habis (Rate Limit). Google membatasi 15 pesan per menit untuk akun gratis. Silakan tunggu sekitar 30 detik lalu coba lagi.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* Left Pane: Chat */}
      <GlassCard className="flex flex-col w-1/3 h-full p-0 overflow-hidden border-r border-glass-border/40">
        <div className="p-4 border-b border-glass-border/40 bg-glass-bg/50">
          <h2 className="font-semibold flex items-center">
            <Bot className="w-5 h-5 mr-2 text-primary" /> Copilot Chat
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.role === "assistant" ? "items-start" : "items-end"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-xl px-4 py-3 text-sm ${
                  message.role === "assistant"
                    ? "bg-white/5 border border-glass-border/40 text-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: CodeBlock
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="bg-white/5 border border-glass-border/40 rounded-xl px-4 py-3 w-max">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-glass-border/40 bg-glass-bg/50">
          <form onSubmit={onFormSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to write code..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </GlassCard>

      {/* Right Pane: Code Editor */}
      <div className="flex flex-col flex-1 h-full glass-panel rounded-xl overflow-hidden border border-glass-border/40">
        <div className="h-12 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-4">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer hover:text-white"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-white hover:bg-white/10">
              <Copy className="w-4 h-4 mr-2" /> Copy
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white border-0">
              <Play className="w-4 h-4 mr-2" /> Run
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16 },
              fontFamily: "var(--font-geist-mono), monospace",
            }}
          />
        </div>
      </div>
    </div>
  );
}
