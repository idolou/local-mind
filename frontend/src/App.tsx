import { useChat } from './hooks/useChat';
import { ChatBubble } from './components/ChatBubble';
import { InputArea } from './components/InputArea';
import { BrainCircuit } from 'lucide-react';
import { useEffect, useRef } from 'react';

function App() {
  // Use a stable session ID for now
  const SESSION_ID = "demo-session-1";
  const { messages, status, sendMessage } = useChat(SESSION_ID);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
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
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-0">
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
  );
}

export default App;
