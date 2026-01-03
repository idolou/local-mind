import { useChat } from './hooks/useChat';
import { ChatBubble } from './components/ChatBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { InputArea } from './components/InputArea';
import { ModelManager } from './components/ModelManager';
import { Sidebar } from './components/Sidebar';
import { BrainCircuit, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Session = {
  id: string;
  title: string;
  created_at: number;
};

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize: Load sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('http://localhost:8000/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        // If we have sessions but no current one selected, select the first (latest)
        if (data.length > 0 && !currentSessionId) {
          setCurrentSessionId(data[0].id);
        } else if (data.length === 0) {
          // No sessions, create one
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch('http://localhost:8000/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: "New Chat" })
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        // On mobile, close sidebar after creating
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      }
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // Only init chat if we have a session ID
  const { messages, status, sendMessage, isTyping } = useChat(currentSessionId || "temp");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // If no session yet, show loading or empty
  if (!currentSessionId) return <div className="h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && window.innerWidth < 768 && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative z-30 h-full transition-transform duration-200 md:translate-x-0`}>
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="p-2 bg-primary/20 rounded-lg">
              <BrainCircuit className="text-primary w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Local-Mind</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {status === 'connected' ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>

          {/* Model Manager Component */}
          <ModelManager />
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-0 scroll-smooth">
          <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-end">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 mt-20">
                <BrainCircuit size={48} className="mb-4 opacity-20" />
                <p className="text-lg">Your private, local AI is ready.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <ChatBubble key={idx} role={msg.role} content={msg.content} />
              ))
            )}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </main>

        {/* Input Area */}
        <footer className="shrink-0 bg-gradient-to-t from-slate-950 to-transparent pt-4">
          <InputArea onSend={sendMessage} disabled={status !== 'connected'} />
          <p className="text-center text-xs text-slate-600 pb-4">
            Local-Mind v1.0 • Private & Secure
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
