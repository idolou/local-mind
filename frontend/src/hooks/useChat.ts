import { useState, useEffect, useRef } from 'react';

export type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export const useChat = (sessionId: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Connect to WebSocket
        const ws = new WebSocket(`ws://localhost:8000/ws/chat/${sessionId}`);

        ws.onopen = () => setStatus('connected');
        ws.onclose = () => setStatus('disconnected');
        ws.onerror = () => setStatus('disconnected');

        ws.onmessage = (event) => {
            const token = event.data;
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                // If the last message is from assistant, append to it
                if (lastMsg && lastMsg.role === 'assistant') {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: lastMsg.content + token }
                    ];
                } else {
                    // Otherwise start a new assistant message
                    return [...prev, { role: 'assistant', content: token }];
                }
            });
        };

        wsRef.current = ws;

        return () => {
            ws.close();
        };
    }, [sessionId]);

    const sendMessage = (text: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Optimistic update
            setMessages((prev) => [...prev, { role: 'user', content: text }]);
            wsRef.current.send(text);
        }
    };

    return { messages, status, sendMessage };
};
