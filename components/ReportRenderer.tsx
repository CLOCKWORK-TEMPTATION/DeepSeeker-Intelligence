import React from 'react';

interface ReportRendererProps {
  markdown: string;
}

// A simple parser to handle the specific requirements: Tables, Headers, Bold, Lists, Links, Code Blocks.
export const ReportRenderer: React.FC<ReportRendererProps> = ({ markdown }) => {
  
  const renderLine = (line: string, index: number): React.ReactNode => {
    // Headers
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-3xl font-serif font-bold text-cyan-50 mt-12 mb-8 border-b border-cyan-900/50 pb-4">{parseInline(line.substring(3))}</h2>;
    }
    if (line.startsWith('### ')) {
      const content = line.substring(4);
      // Highlight "Limitations" headers to emphasize them as requested
      const isLimitations = content.toLowerCase().includes('limitations') || 
                          content.toLowerCase().includes('deficiencies') || 
                          content.toLowerCase().includes('weaknesses') ||
                          content.toLowerCase().includes('drawbacks');
      
      return (
        <h3 key={index} className={`text-xl font-serif font-semibold mt-8 mb-4 ${isLimitations ? 'text-amber-200/90' : 'text-cyan-100'}`}>
          {parseInline(content)}
        </h3>
      );
    }
    if (line.startsWith('#### ')) {
      return <h4 key={index} className="text-lg font-serif font-medium text-cyan-200 mt-6 mb-3">{parseInline(line.substring(5))}</h4>;
    }

    // List items
    if (line.trim().startsWith('- ')) {
      return <li key={index} className="ml-6 list-disc pl-2 mb-2 text-slate-300 leading-relaxed marker:text-cyan-700">{parseInline(line.trim().substring(2))}</li>;
    }
    if (line.trim().match(/^\d+\.\s/)) {
      const content = line.trim().replace(/^\d+\.\s/, '');
      return <li key={index} className="ml-6 list-decimal pl-2 mb-2 text-slate-300 leading-relaxed marker:text-cyan-700">{parseInline(content)}</li>;
    }

    // Empty lines
    if (line.trim() === '') {
      return <div key={index} className="h-4"></div>;
    }

    // Default Paragraph
    return <p key={index} className="mb-4 text-slate-300 leading-relaxed font-light">{parseInline(line)}</p>;
  };

  // Helper to parse bold, links, etc.
  const parseInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Regex for bold and links
    const regex = /(\*\*(.*?)\*\*)|(\[(.*?)\]\((.*?)\))/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[1]) { // Bold
        parts.push(<strong key={match.index} className="font-bold text-cyan-400">{match[2]}</strong>);
      } else if (match[3]) { // Link
        parts.push(
          <a 
            key={match.index} 
            href={match[5]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 decoration-cyan-700/50 transition-colors text-sm font-mono mx-1 inline-flex items-center gap-0.5"
          >
            <span>[{match[4]}]</span>
          </a>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const renderCodeBlock = (lines: string[], key: string) => {
    return (
        <div key={key} className="my-8 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative p-6 bg-slate-900 rounded-lg border border-slate-700 overflow-x-auto shadow-xl">
              <pre className="font-mono text-xs md:text-sm text-cyan-200 whitespace-pre leading-snug">
                  {lines.join('\n')}
              </pre>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-2 text-center uppercase tracking-widest">Figure / Visualization</div>
        </div>
    );
  };

  const blocks = markdown.split('\n');
  const output: React.ReactNode[] = [];
  let currentTable: string[] = [];
  let inTable = false;
  let currentCodeBlock: string[] = [];
  let inCodeBlock = false;

  blocks.forEach((line, i) => {
    // Check for Code Block start/end
    if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
             output.push(renderCodeBlock(currentCodeBlock, `code-${i}`));
             currentCodeBlock = [];
             inCodeBlock = false;
        } else {
             if (inTable) {
                 output.push(renderTable(currentTable, `table-flush-${i}`));
                 currentTable = [];
                 inTable = false;
             }
             inCodeBlock = true;
        }
        return;
    }

    if (inCodeBlock) {
        currentCodeBlock.push(line);
        return;
    }

    // Check for table row
    if (line.trim().startsWith('|')) {
      inTable = true;
      currentTable.push(line);
    } else {
      if (inTable) {
        // Render the collected table
        output.push(renderTable(currentTable, `table-${i}`));
        currentTable = [];
        inTable = false;
      }
      // Render normal line if not empty table buffer
      output.push(renderLine(line, i));
    }
  });
  
  // Flush remaining table or code block
  if (inTable) {
      output.push(renderTable(currentTable, `table-end`));
  }
  if (inCodeBlock) {
      output.push(renderCodeBlock(currentCodeBlock, `code-end`));
  }

  return <div className="font-serif max-w-none pb-20">{output}</div>;
};

const renderTable = (lines: string[], key: string) => {
  if (lines.length < 2) return null;

  const headerRow = lines[0];
  const dataRows = lines.slice(2);

  const parseRow = (row: string) => {
    return row.split('|').filter(c => c.trim() !== '').map(c => c.trim());
  };

  const headers = parseRow(headerRow);

  return (
    // Added specific border styles and text colors to ensure high contrast for PDF export
    <div key={key} className="overflow-x-auto my-10 rounded-xl border border-slate-600 shadow-2xl bg-slate-900">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-slate-800 text-cyan-50 font-bold uppercase tracking-wider text-xs font-mono">
          <tr>
            {headers.map((h, idx) => (
              <th key={idx} className="px-6 py-5 border-b-2 border-slate-500 first:pl-8 last:pr-8 whitespace-nowrap bg-slate-800">
                {parseHeader(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {dataRows.map((row, rIdx) => {
             const cells = parseRow(row);
             return (
              <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors group">
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-6 py-5 text-slate-200 font-sans border-r border-slate-700/50 last:border-r-0 min-w-[150px] first:pl-8 last:pr-8 leading-relaxed align-top">
                    {parseCell(cell)} 
                  </td>
                ))}
              </tr>
             );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Simple helper to bold text in headers/cells if needed (though markdown inside tables is tricky with this simple parser)
const parseHeader = (text: string) => text.replace(/\*\*/g, '');
const parseCell = (text: string) => {
    // Basic link parsing for table cells
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
         if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
         parts.push(
            <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline text-xs font-mono">
                {match[1]}
            </a>
         );
         lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts.length > 0 ? parts : text;
};