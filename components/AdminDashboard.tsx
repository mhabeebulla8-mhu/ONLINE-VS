
import React, { useState } from 'react';
import { Users, Vote, Activity, Database, ShieldCheck, AlertTriangle, Terminal, Plus, Trash2, X } from 'lucide-react';
import { Candidate, AuditLog } from '../types';
import { CONSTITUENCIES } from '../constants';

interface AdminDashboardProps {
  candidates: Candidate[];
  onAddCandidate: (c: Candidate) => void;
  onDeleteCandidate: (id: string) => void;
  totalVoters: number;
  votesCast: number;
  logs: AuditLog[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  candidates, 
  onAddCandidate, 
  onDeleteCandidate, 
  totalVoters, 
  votesCast,
  logs
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCandidate, setNewCandidate] = useState<Partial<Candidate>>({
    name: '',
    party: '',
    symbol: '🇮🇳',
    constituency: CONSTITUENCIES[0],
    description: ''
  });

  const turnout = ((votesCast / totalVoters) * 100).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCandidate.name && newCandidate.party) {
      onAddCandidate({
        ...newCandidate as Candidate,
        id: Math.random().toString(36).substr(2, 9)
      });
      setIsAdding(false);
      setNewCandidate({
        name: '',
        party: '',
        symbol: '🇮🇳',
        constituency: CONSTITUENCIES[0],
        description: ''
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Modal for adding candidate */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">Add New Candidate</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                  <input
                    required
                    value={newCandidate.name}
                    onChange={e => setNewCandidate({...newCandidate, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                    placeholder="e.g. Amit Varma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Party</label>
                  <input
                    required
                    value={newCandidate.party}
                    onChange={e => setNewCandidate({...newCandidate, party: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                    placeholder="e.g. Independent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Constituency</label>
                  <select
                    value={newCandidate.constituency}
                    onChange={e => setNewCandidate({...newCandidate, constituency: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                  >
                    {CONSTITUENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Symbol (Emoji)</label>
                  <input
                    value={newCandidate.symbol}
                    onChange={e => setNewCandidate({...newCandidate, symbol: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                    placeholder="⚡"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Manifesto Snippet</label>
                <textarea
                  rows={2}
                  value={newCandidate.description}
                  onChange={e => setNewCandidate({...newCandidate, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none resize-none"
                  placeholder="Focusing on education..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#000080] text-white py-4 rounded-2xl font-bold hover:bg-blue-900 shadow-xl transition-all transform active:scale-95"
              >
                Register Candidate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Registered</span>
          </div>
          <h4 className="text-3xl font-black text-gray-800">{totalVoters.toLocaleString()}</h4>
          <p className="text-xs text-gray-500 mt-1">Total Eligible Voters</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Vote size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cast</span>
          </div>
          <h4 className="text-3xl font-black text-gray-800">{votesCast.toLocaleString()}</h4>
          <p className="text-xs text-gray-500 mt-1">Confirmed Ballots</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Activity size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Turnout</span>
          </div>
          <h4 className="text-3xl font-black text-gray-800">{turnout}%</h4>
          <p className="text-xs text-gray-500 mt-1">Current Participation Rate</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nodes</span>
          </div>
          <h4 className="text-3xl font-black text-gray-800">12/12</h4>
          <p className="text-xs text-gray-500 mt-1">Active Server Clusters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Candidate Management Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database size={20} className="text-[#000080]" />
              <h3 className="font-bold text-gray-800">Election Registry</h3>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-blue-50 text-[#000080] rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>Add Candidate</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3">Symbol</th>
                  <th className="px-6 py-3">Candidate Name</th>
                  <th className="px-6 py-3">Party</th>
                  <th className="px-6 py-3">Constituency</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {candidates.map((c) => (
                  <tr key={c.id} className="text-sm hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-2xl">{c.symbol}</td>
                    <td className="px-6 py-4">
                       <p className="font-bold text-gray-800">{c.name}</p>
                       <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{c.description}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{c.party}</td>
                    <td className="px-6 py-4 font-mono text-xs">{c.constituency}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDeleteCandidate(c.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Candidate"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                        No candidates currently registered. Use the "Add Candidate" button to begin.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Audit Log */}
        <div className="bg-[#1a1c1e] text-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
            <div className="flex items-center space-x-2">
              <Terminal size={18} className="text-green-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest">System Audit Log</h3>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <div className="p-4 space-y-4 font-mono text-[11px] overflow-y-auto max-h-[500px]">
            {logs.map((log) => (
              <div key={log.id} className="border-l-2 border-slate-600 pl-3 py-1 animate-fadeIn">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500">{log.timestamp}</span>
                  <span className={`px-1 rounded ${
                    log.severity === 'critical' ? 'bg-red-900/40 text-red-200 border border-red-500/30' : 
                    log.severity === 'warning' ? 'bg-amber-900/40 text-amber-200 border border-amber-500/30' : 
                    'bg-blue-900/40 text-blue-200 border border-blue-500/30'
                  }`}>
                    {log.action}
                  </span>
                </div>
                <p className="text-slate-300 leading-normal">{log.details}</p>
              </div>
            ))}
          </div>
          <div className="p-3 bg-slate-900 mt-auto">
             <div className="flex items-center justify-center text-[10px] text-slate-500 space-x-2 uppercase">
               <AlertTriangle size={10} />
               <span>E2EE Verifiable Chain Active</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
