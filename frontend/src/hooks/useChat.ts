import { useState, useEffect, useRef } from 'react';

export type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export const useChat = (sessionId: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [isTyping, setIsTyping] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // 1. Fetch History
        const fetchHistory = async () => {
            try {
                const res = await fetch(`http://localhost:8000/sessions/${sessionId}/history`);
                if (res.ok) {
                    const history = await res.json();
                    setMessages(history);
                }
            } catch (err) {
                console.error("Failed to fetch history:", err);
            }
        };
        fetchHistory();

        // 2. Connect to WebSocket
        const ws = new WebSocket(`ws://localhost:8000/ws/chat/${sessionId}`);

        ws.onopen = () => setStatus('connected');
        ws.onclose = () => {
            setStatus('disconnected');
            setIsTyping(false);
        }
        ws.onerror = () => {
            setStatus('disconnected');
            setIsTyping(false);
        }

        ws.onmessage = (event) => {
            const token = event.data;
            setIsTyping(false); // Received data, so stop typing
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
            setIsTyping(true); // Start typing indicator
            wsRef.current.send(text);
        }
    };

    return { messages, status, sendMessage, isTyping };
};
