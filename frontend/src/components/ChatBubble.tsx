import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type Props = {
    role: 'user' | 'assistant';
    content: string;
};

export const ChatBubble = ({ role, content }: Props) => {
    const isUser = role === 'user';

    return (
        <div className={twMerge(clsx("flex w-full mb-6", isUser ? "justify-end" : "justify-start"))}>
            <div className={twMerge(clsx(
                "flex max-w-[80%] md:max-w-[70%] rounded-2xl p-4 shadow-sm",
                isUser ? "bg-primary text-white" : "bg-slate-800 border border-slate-700 text-slate-200"
            ))}>
                <div className="mr-4 mt-1 shrink-0">
                    {isUser ? <User size={20} /> : <Bot size={20} className="text-secondary" />}
                </div>
                <div className="prose prose-invert prose-sm w-full break-words">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
};
