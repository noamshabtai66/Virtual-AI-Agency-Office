
import React, { useState } from 'react';
import { ResearchEntry, Agent } from '../types';
import { Search, Filter, ExternalLink, Brain, TrendingUp, ShieldCheck, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResearchHubProps {
  research: ResearchEntry[];
  agents: Agent[];
}

export const ResearchHub: React.FC<ResearchHubProps> = ({ research, agents }) => {
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResearch = (research || []).filter(entry => {
    if (!entry) return false;
    const matchesFilter = filter === 'All' || (entry.category || 'Internal') === filter;
    const searchText = ((entry.title || "") + (entry.summary || "")).toLowerCase();
    const matchesSearch = searchText.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = ['All', 'Market', 'Tech', 'Competitor', 'Internal'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col justify-center">
          <h2 className="text-white text-4xl font-light tracking-tight mb-2">Intelligence Hub</h2>
          <p className="text-zinc-500 text-sm max-w-xl">
            Centralized repository of autonomous research findings, market intelligence, and technical breakthroughs gathered by the agent network.
          </p>
        </div>
        <div className="glass p-6 rounded-3xl border border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Insights</span>
            <span className="text-3xl font-black text-white">{research.length}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Brain size={24} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all
                ${filter === cat ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder="Search intelligence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* Research Feed */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredResearch.map((entry, idx) => {
            const agent = agents?.find(a => a.id === entry.agentId);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                key={entry.id}
                className="glass rounded-[2rem] border border-white/5 p-8 hover:border-white/10 transition-all group relative overflow-hidden"
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
                
                <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                  {/* Left: Metadata */}
                  <div className="lg:w-64 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                        <img src={agent?.avatar} alt={agent?.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-xs">{agent?.name}</span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{agent?.role}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Importance</span>
                        <div className="flex gap-1">
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < entry.importance ? 'bg-blue-500' : 'bg-zinc-800'}`}></div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Category</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest 
                          ${entry.category === 'Tech' ? 'text-purple-400' : 
                            entry.category === 'Market' ? 'text-emerald-400' : 
                            entry.category === 'Competitor' ? 'text-orange-400' : 'text-blue-400'}`}>
                          {entry.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(entry.tags || []).map(tag => (
                          <span key={tag} className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-zinc-500 uppercase font-bold">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white text-2xl font-light tracking-tight group-hover:text-blue-400 transition-colors">{entry.title}</h3>
                      <span className="text-[10px] font-mono text-zinc-600">{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {entry.summary}
                    </p>
                    
                    <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-3 block">Verified Sources</span>
                        <div className="flex flex-wrap gap-3">
                          {(entry.sources || []).map((source, sIdx) => (
                            <a 
                              key={sIdx}
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-[10px] text-zinc-400 hover:text-blue-400 transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
                            >
                              <Globe size={12} />
                              {source.title}
                              <ExternalLink size={10} />
                            </a>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all">
                          Full Analysis
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredResearch.length === 0 && (
          <div className="text-center py-20 glass rounded-[2rem] border border-white/5">
            <Search size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm">No intelligence found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
