import React, { useState } from 'react';
import { Send } from 'lucide-react';

type Props = {
    onSend: (text: string) => void;
    disabled?: boolean;
};

export const InputArea = ({ onSend, disabled }: Props) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSend(input);
            setInput("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-4xl mx-auto p-4">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={disabled}
                    placeholder={disabled ? "Connecting..." : "Message Local-Mind..."}
                    className="w-full bg-slate-800 text-slate-100 rounded-full py-4 pl-6 pr-14 outline-none border border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || disabled}
                    className="absolute right-2 p-2 bg-primary text-white rounded-full hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={20} />
                </button>
            </div>
        </form>
    );
};
