import { MessageSquare, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Session = {
    id: string;
    title: string;
    created_at: number;
};

interface SidebarProps {
    sessions: Session[];
    currentSessionId: string;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
}

export function Sidebar({ sessions, currentSessionId, onSelectSession, onNewChat }: SidebarProps) {
    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
            <div className="p-4 border-b border-slate-800">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-2 justify-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium text-sm"
                >
                    <Plus size={16} />
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {sessions.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm mt-4 px-4">
                        No chats yet. Start a new one!
                    </div>
                ) : (
                    <div className="space-y-1 px-2">
                        {sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors ${currentSessionId === session.id
                                    ? 'bg-slate-800 text-slate-100'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                    }`}
                            >
                                <MessageSquare size={16} className="mt-1 shrink-0" />
                                <div className="overflow-hidden">
                                    <div className="truncate font-medium text-sm text-slate-200">
                                        {session.title || 'New Chat'}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">
                                        {formatDistanceToNow(session.created_at * 1000, { addSuffix: true })}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
