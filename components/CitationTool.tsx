import React, { useState, useEffect } from 'react';

interface Citation {
  id: string;
  title: string;
  url: string;
  verified: boolean;
  status: 'unknown' | 'live' | 'error' | 'checking';
  type: 'extracted' | 'manual';
}

interface CitationToolProps {
  markdown: string;
}

export const CitationTool: React.FC<CitationToolProps> = ({ markdown }) => {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [manualCheckStatus, setManualCheckStatus] = useState<'idle' | 'checking' | 'found' | 'error'>('idle');

  useEffect(() => {
    if (!markdown) return;
    
    // Extract citations from markdown [Title](URL)
    const regex = /(?<!\!)\[(.*?)\]\((.*?)\)/g;
    const found: Citation[] = [];
    const seenUrls = new Set<string>();

    let match;
    while ((match = regex.exec(markdown)) !== null) {
      const title = match[1];
      const url = match[2];
      
      if (url.startsWith('http') && !seenUrls.has(url)) {
        seenUrls.add(url);
        found.push({
          id: `cit-${found.length}`,
          title: title.substring(0, 70) + (title.length > 70 ? '...' : ''),
          url,
          verified: false,
          status: 'unknown',
          type: 'extracted'
        });
      }
    }
    setCitations(found);
  }, [markdown]);

  const checkUrl = async (url: string): Promise<boolean> => {
    try {
        // We use mode: 'no-cors' which usually returns an opaque response if reachable.
        // It won't give status 200, but if it throws, it's a network error (blocked/offline/dns).
        await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        return true;
    } catch (e) {
        return false;
    }
  };

  const checkCitationStatus = async (id: string, url: string) => {
    setCitations(prev => prev.map(c => c.id === id ? { ...c, status: 'checking' } : c));
    const isLive = await checkUrl(url);
    
    setCitations(prev => prev.map(c => 
        c.id === id ? { 
            ...c, 
            status: isLive ? 'live' : 'error',
            verified: isLive // Auto-verify if live
        } : c
    ));
  };

  const toggleVerify = (id: string) => {
    setCitations(prev => prev.map(c => 
      c.id === id ? { ...c, verified: !c.verified } : c
    ));
  };

  const handleUrlBlur = async () => {
      if (!newUrl || !newUrl.startsWith('http')) return;
      
      setManualCheckStatus('checking');
      const isLive = await checkUrl(newUrl);
      
      if (isLive) {
          // Attempt to guess title from URL structure if empty
          if (!newTitle) {
              try {
                  const urlObj = new URL(newUrl);
                  const path = urlObj.pathname.split('/').pop() || urlObj.hostname;
                  const cleanPath = path.replace(/[-_]/g, ' ').replace(/\.html?$/, '');
                  setNewTitle(cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1));
              } catch (e) {
                  // ignore
              }
          }
          setManualCheckStatus('found');
      } else {
          setManualCheckStatus('error');
      }
  };

  const addManualCitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    setCitations(prev => [
      ...prev,
      {
        id: `man-${Date.now()}`,
        title: newTitle,
        url: newUrl,
        verified: manualCheckStatus === 'found',
        status: manualCheckStatus === 'found' ? 'live' : 'unknown',
        type: 'manual'
      }
    ]);
    setNewTitle('');
    setNewUrl('');
    setManualCheckStatus('idle');
  };

  const stats = {
    total: citations.length,
    verified: citations.filter(c => c.verified).length,
    manual: citations.filter(c => c.type === 'manual').length
  };

  const progress = stats.total > 0 ? (stats.verified / stats.total) * 100 : 0;

  return (
    <div className="mt-8 border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden transition-all duration-300 shadow-lg">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${progress === 100 ? 'bg-green-900/30 text-green-400' : 'bg-cyan-900/30 text-cyan-400'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Citation Verification Protocol
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {stats.verified}/{stats.total} Sources Verified • {stats.manual} Added
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="hidden md:block w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-cyan-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <svg 
                className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Detected Sources</h4>
                    <span className="text-[10px] text-slate-600 font-mono">{citations.filter(c => c.type === 'extracted').length} Found</span>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                    {citations.map(citation => (
                        <div 
                            key={citation.id} 
                            className={`p-3 rounded border transition-all flex items-start justify-between gap-3 ${
                                citation.verified 
                                ? 'bg-green-950/10 border-green-900/30' 
                                : 'bg-slate-950/30 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    {citation.type === 'manual' && (
                                        <span className="text-[9px] bg-blue-900/30 text-blue-400 px-1 rounded border border-blue-900/50">MANUAL</span>
                                    )}
                                    <div className="text-xs font-medium text-slate-300 truncate font-mono" title={citation.title}>
                                        {citation.title}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a 
                                        href={citation.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-cyan-600 hover:text-cyan-400 truncate block hover:underline max-w-[200px]"
                                    >
                                        {citation.url}
                                    </a>
                                    {citation.status === 'live' && <span className="text-[9px] text-green-500 font-mono">[LIVE]</span>}
                                    {citation.status === 'error' && <span className="text-[9px] text-red-500 font-mono">[UNREACHABLE]</span>}
                                    {citation.status === 'checking' && <span className="text-[9px] text-yellow-500 font-mono animate-pulse">[CHECKING]</span>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => checkCitationStatus(citation.id, citation.url)}
                                    className="p-1.5 rounded-md transition-colors bg-slate-800 text-slate-400 hover:bg-cyan-900/30 hover:text-cyan-400"
                                    title="Check URL Validity"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => toggleVerify(citation.id)}
                                    className={`p-1.5 rounded-md transition-colors ${
                                        citation.verified 
                                        ? 'text-green-400 bg-green-900/20 hover:bg-green-900/30' 
                                        : 'text-slate-500 bg-slate-800 hover:text-cyan-400 hover:bg-slate-700'
                                    }`}
                                    title={citation.verified ? "Verified" : "Mark as Verified"}
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {citations.length === 0 && (
                        <div className="text-slate-600 text-xs italic py-4 text-center border border-slate-800 border-dashed rounded">No citations detected in report.</div>
                    )}
                </div>
            </div>

            {/* Add New */}
            <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">Add Supplemental Source</h4>
                <form onSubmit={addManualCitation} className="p-5 bg-slate-950/50 rounded-lg border border-slate-800 space-y-4">
                    <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase flex justify-between">
                            <span>Primary Source URL</span>
                            {manualCheckStatus === 'checking' && <span className="text-yellow-500">Checking...</span>}
                            {manualCheckStatus === 'found' && <span className="text-green-500">Accessible</span>}
                            {manualCheckStatus === 'error' && <span className="text-red-500">Unreachable</span>}
                        </label>
                        <input
                            type="url"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            onBlur={handleUrlBlur}
                            className={`w-full bg-slate-900 border rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-700 transition-colors placeholder-slate-600 ${
                                manualCheckStatus === 'error' ? 'border-red-900/50 focus:border-red-700' : 'border-slate-700'
                            }`}
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Source Title / Reference</label>
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-700 transition-colors placeholder-slate-600"
                            placeholder={manualCheckStatus === 'found' ? "Auto-fill available (edit if needed)" : "e.g., Q3 2024 Market Report"}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={!newTitle || !newUrl}
                        className="w-full bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-800/50 text-cyan-400 py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add to Protocol
                    </button>
                </form>

                <div className="p-4 rounded bg-blue-900/10 border border-blue-900/30 text-[10px] text-blue-300/80 leading-relaxed">
                    <strong className="text-blue-300 block mb-1 font-mono uppercase">Citation Policy</strong>
                    Ensure all added sources meet the <span className="text-blue-200">Radical Citation Mandate</span>. Only primary sources (official docs, academic papers, verified reports) are permitted.
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};