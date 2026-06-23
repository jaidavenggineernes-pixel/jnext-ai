"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Copy, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion } from "framer-motion";

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2 md:mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">Powered by advanced AI models</p>
        </div>
      </div>

      <GlassCard className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Bot className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">How can I help you today?</p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`flex space-x-3 ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 mt-auto mb-1 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-5 py-3.5 ${
                    message.role === "assistant"
                      ? "bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-foreground backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.1)] rounded-bl-sm"
                      : "bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(6,182,212,0.2)] rounded-br-sm"
                  }`}
                >
                  <div className={`prose prose-sm dark:prose-invert max-w-none ${message.role === "user" ? "text-white prose-p:text-white" : ""}`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: CodeBlock
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 mt-auto mb-1 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex space-x-3 justify-start"
            >
              <div className="w-8 h-8 mt-auto mb-1 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl rounded-bl-sm px-5 py-3.5 flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-glass-border/40 bg-glass-bg/50">
          <form
            onSubmit={onFormSubmit}
            className="flex items-center space-x-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message JNext AI..."
              className="flex-1 bg-white/5"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90 rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
