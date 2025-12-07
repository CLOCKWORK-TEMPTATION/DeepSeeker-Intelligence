import React, { useState } from 'react';

interface InputSectionProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onSubmit, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query);
    }
  };

  return (
    <div className={`transition-all duration-700 ease-out flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 ${isLoading ? 'py-8' : 'min-h-[60vh]'}`}>
      
      {!isLoading && (
        <div className="text-center mb-10 space-y-4 animate-in fade-in zoom-in duration-700">
          <div className="inline-block p-2 px-4 rounded-full bg-cyan-950/30 border border-cyan-900/50 text-cyan-400 text-xs font-mono tracking-[0.2em] uppercase mb-4">
            DeepSeeker Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-100 to-slate-200 tracking-tight">
            Academic Rigor.<br />Radical Neutrality.
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg font-light leading-relaxed">
            Deconstructing queries, excavating primary sources, and rigorous claim validation.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full relative group z-10">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Enter research query (e.g., 'Compare vector database performance for RAG systems')..."
            className="w-full bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-xl px-6 py-5 text-lg shadow-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-3 top-3 bottom-3 bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-lg font-medium transition-all disabled:opacity-0 disabled:translate-x-4 flex items-center gap-2 shadow-lg"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Initialize
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tags/Suggestions */}
      {!isLoading && (
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-slate-500 font-mono">
          {['Open Source vs Closed Models', 'React Performance Patterns', 'Global Economic Trends 2024'].map((tag) => (
            <button 
              key={tag} 
              onClick={() => setQuery(tag)}
              className="px-3 py-1.5 rounded border border-slate-800 hover:border-cyan-800 hover:text-cyan-400 transition-colors bg-slate-900/50"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
