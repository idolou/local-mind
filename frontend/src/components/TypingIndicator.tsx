import { Bot } from 'lucide-react';

export const TypingIndicator = () => {
    return (
        <div className="flex w-full mb-6 justify-start">
            <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="shrink-0">
                    <Bot size={20} className="text-secondary animate-pulse" />
                </div>
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                </div>
            </div>
        </div>
    );
};
