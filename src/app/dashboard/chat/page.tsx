"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Copy, Check, Paperclip, X, Video, Menu, MessageSquare, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion } from "framer-motion";

type Attachment = { url: string; mimeType: string; name: string };
type Message = { id: string; role: "user" | "assistant"; content: string; attachments?: Attachment[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [conversations, setConversations] = useState<{id: string, title: string, updatedAt: string}[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat/history");
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const loadConversation = async (id: string) => {
    setCurrentConversationId(id);
    setIsSidebarOpen(false);
    setIsLoading(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/chat/${id}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages.map((m: { id: string, role: "user" | "assistant", content: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("Ukuran file maksimal adalah 4MB untuk menjaga kestabilan sistem.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedFile({
        url: e.target?.result as string,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    // Reset input value so same file can be selected again if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;
    
    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      content: input,
      attachments: selectedFile ? [selectedFile] : undefined
    };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, conversationId: currentConversationId })
      });

      if (!response.ok) {
        let errMsg = "Failed to connect to API";
        try {
          const errData = await response.json();
          if (errData.error) errMsg = errData.error;
        } catch (e) {}
        throw new Error(errMsg);
      }
      
      const newConvId = response.headers.get("X-Conversation-Id");
      if (newConvId && newConvId !== currentConversationId) {
        setCurrentConversationId(newConvId);
        fetchConversations(); // refresh list
      }

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
        content: `⚠️ **Prioritas Jaringan Penuh:** Jalur antrean untuk paket Anda saat ini sedang padat. Ingin pengalaman super cepat tanpa antrean? **Upgrade langganan JNext Anda ke paket Premium sekarang** untuk mendapatkan prioritas utama dan kuota tanpa batas! 🚀💎` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] -m-4 md:m-0 relative bg-black/20 md:bg-transparent overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#0a0a0a] border-r border-white/10 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <h2 className="font-semibold text-white">Riwayat Chat</h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-4">
          <Button onClick={startNewChat} className="w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Chat Baru
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`w-full text-left flex items-center p-3 rounded-xl transition-colors ${currentConversationId === conv.id ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}
            >
              <MessageSquare className="w-4 h-4 mr-3 shrink-0" />
              <div className="overflow-hidden flex-1">
                <p className="text-sm truncate font-medium">{conv.title || "New Chat"}</p>
                <p className="text-[10px] opacity-60 truncate mt-0.5">
                  {new Date(conv.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-center text-muted-foreground mt-10">Belum ada riwayat chat.</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 max-w-5xl mx-auto w-full md:p-4">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
          <Button variant="ghost" size="icon" className="mr-3" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="font-semibold truncate flex-1 text-sm text-white">
            {currentConversationId ? conversations.find(c => c.id === currentConversationId)?.title || "Percakapan" : "AI Assistant"}
          </div>
          <Button variant="ghost" size="icon" onClick={startNewChat}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-4 px-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {currentConversationId ? conversations.find(c => c.id === currentConversationId)?.title || "Percakapan" : "AI Assistant"}
            </h1>
            <p className="text-sm text-muted-foreground">Powered by advanced AI models</p>
          </div>
        </div>

        <GlassCard className="flex-1 flex flex-col overflow-hidden p-0 rounded-none md:rounded-2xl border-x-0 md:border-x">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
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
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {message.attachments.map((att, i) => (
                        att.mimeType.startsWith('image/') ? (
                          <img key={i} src={att.url} alt="attachment" className="h-32 sm:h-48 rounded-xl object-cover border border-white/20 shadow-lg" />
                        ) : (
                          <div key={i} className="h-16 px-4 rounded-xl bg-black/20 flex items-center justify-center border border-white/20 text-xs shadow-inner">
                            <Video className="w-4 h-4 mr-2" /> {att.name}
                          </div>
                        )
                      ))}
                    </div>
                  )}
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
          {selectedFile && (
            <div className="mb-4 relative inline-block p-1 bg-white/5 rounded-xl border border-white/10">
              {selectedFile.mimeType.startsWith('image/') ? (
                <img src={selectedFile.url} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
              ) : (
                <div className="h-20 px-4 rounded-lg bg-black/40 flex items-center justify-center text-xs text-muted-foreground border border-white/5">
                  <Video className="w-4 h-4 mr-2" /> {selectedFile.name}
                </div>
              )}
              <button 
                onClick={() => setSelectedFile(null)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <form
            onSubmit={onFormSubmit}
            className="flex items-center space-x-2"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/mp4,video/webm"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-white/5 border-white/10 text-muted-foreground hover:text-white shrink-0 rounded-xl"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
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
              disabled={isLoading || (!input.trim() && !selectedFile)}
              className="bg-primary hover:bg-primary/90 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
