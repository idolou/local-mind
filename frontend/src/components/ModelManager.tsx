import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Trash2, Download, Check, X, Loader2, Database } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Model {
    name: string;
    modified_at: string;
    size: number;
}

export function ModelManager() {
    const [isOpen, setIsOpen] = useState(false);
    const [models, setModels] = useState<Model[]>([]);
    const [activeModel, setActiveModel] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [pullModelName, setPullModelName] = useState('');
    const [pulling, setPulling] = useState(false);

    // Fetch models
    const fetchModels = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/llm/models`);
            const data = await res.json();
            if (data.models) setModels(data.models);
            if (data.active_model) setActiveModel(data.active_model);
        } catch (err) {
            console.error("Failed to fetch models", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchModels();
    }, [isOpen]);

    const handleSetActive = async (name: string) => {
        try {
            await fetch(`${API_URL}/llm/active`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            setActiveModel(name);
        } catch (err) {
            console.error("Failed to set active model", err);
        }
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            await fetch(`${API_URL}/llm/${name}`, { method: 'DELETE' });
            fetchModels();
        } catch (err) {
            console.error("Failed to delete model", err);
        }
    };

    const handlePull = async () => {
        if (!pullModelName) return;
        try {
            setPulling(true);
            // Fire and forget (backend handles background task)
            await fetch(`${API_URL}/llm/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: pullModelName }),
            });
            alert(`Started pulling ${pullModelName}. This may take a while.`);
            setPullModelName('');
            // In a real app, we'd poll for status, but here we just wait or user refreshes
        } catch (err) {
            console.error("Failed to pull model", err);
        } finally {
            setPulling(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Manage Models"
            >
                <Settings size={20} />
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Database className="text-primary" /> Model Manager
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 space-y-6">
                            {/* Active Model */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-400 uppercase mb-2">Active Model</h3>
                                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary font-mono flex items-center gap-2">
                                    <Check size={16} />
                                    {activeModel || 'Loading...'}
                                </div>
                            </div>

                            {/* Pull New Model */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-400 uppercase mb-2">Download Model</h3>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <select
                                            onChange={(e) => setPullModelName(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer"
                                            value={['llama3', 'gemma:2b', 'mistral', 'phi3'].includes(pullModelName) ? pullModelName : 'custom'}
                                        >
                                            <option value="" disabled>Select a model to install...</option>
                                            <option value="llama3">Llama 3 (8B) - Balanced & Powerful</option>
                                            <option value="gemma:2b">Gemma (2B) - Fast & Lightweight</option>
                                            <option value="mistral">Mistral (7B) - High Performance</option>
                                            <option value="phi3">Phi-3 (3.8B) - Efficient</option>
                                            <option value="custom">Custom...</option>
                                        </select>
                                        <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                                            <Settings size={14} className="opacity-50" />
                                        </div>
                                    </div>

                                    {/* Show text input only if 'custom' is selected or typing manually */}
                                    {(!['llama3', 'gemma:2b', 'mistral', 'phi3'].includes(pullModelName) && pullModelName !== '') || pullModelName === 'custom' ? (
                                        <input
                                            type="text"
                                            value={pullModelName === 'custom' ? '' : pullModelName}
                                            onChange={(e) => setPullModelName(e.target.value)}
                                            placeholder="Type model tag (e.g. neural-chat)"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary animate-in fade-in slide-in-from-top-1"
                                            autoFocus
                                        />
                                    ) : null}

                                    <button
                                        onClick={handlePull}
                                        disabled={pulling || !pullModelName || pullModelName === 'custom'}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-[0_0_10px_rgba(37,99,235,0.3)] hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {pulling ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                        {pulling ? 'Pulling...' : 'Pull Model'}
                                    </button>
                                </div>
                            </div>

                            {/* Installed Models */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-400 uppercase mb-2">Installed Models</h3>
                                {loading ? (
                                    <div className="text-center py-4 text-slate-500">Loading models...</div>
                                ) : (
                                    <div className="space-y-2">
                                        {models.map((model) => (
                                            <div key={model.name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg group">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{model.name}</span>
                                                    <span className="text-xs text-slate-500">{(model.size / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {model.name === activeModel ? (
                                                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Active</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSetActive(model.name)}
                                                            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded"
                                                        >
                                                            use
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(model.name)}
                                                        className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete model"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {models.length === 0 && (
                                            <div className="text-sm text-slate-500 text-center py-2">No models found.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
