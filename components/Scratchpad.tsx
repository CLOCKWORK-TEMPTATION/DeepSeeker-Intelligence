import React, { useState } from 'react';

interface ScratchpadProps {
  content: string;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  return (
    <div className="w-full mb-8 border border-slate-700 rounded-lg overflow-hidden bg-slate-850/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-750 transition-colors text-xs font-mono tracking-wider text-cyan-400 uppercase"
      >
        <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Research Architecture & Planning
        </span>
        <span className="text-slate-400">
          {isOpen ? 'Collapse [-]' : 'Expand [+]'}
        </span>
      </button>
      
      {isOpen && (
        <div className="p-5 font-mono text-sm text-slate-300 whitespace-pre-wrap bg-slate-900 border-t border-slate-700 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
          {content}
        </div>
      )}
    </div>
  );
};
