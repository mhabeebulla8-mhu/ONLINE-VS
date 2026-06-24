import React, { useState } from 'react';
import { Users, Vote, Activity, Database, ShieldCheck, AlertTriangle, Terminal, Plus, Trash2, X, BarChart3, Calendar, Edit2, Check, Ban, Eye, Smartphone, MapPin } from 'lucide-react';
import { Candidate, AuditLog, ConstituencyStat, Election, Voter } from '../types';
import { CONSTITUENCIES } from '../constants';

interface AdminDashboardProps {
  candidates: Candidate[];
  onAddCandidate: (c: Candidate) => void;
  onEditCandidate: (c: Candidate) => void;
  onDeleteCandidate: (id: string) => void;
  totalVoters: number;
  votesCast: number;
  logs: AuditLog[];
  constituencyStats: ConstituencyStat[];
  elections: Election[];
  voters: Voter[];
  onUpdateVoterStatus: (epic: string, status: Voter['status']) => void;
  onAddElection: (e: Election) => void;
  onUpdateElection: (e: Election) => void;
  onDeleteElection: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  candidates, 
  onAddCandidate, 
  onEditCandidate,
  onDeleteCandidate, 
  totalVoters, 
  votesCast,
  logs,
  constituencyStats,
  elections,
  voters,
  onUpdateVoterStatus,
  onAddElection,
  onUpdateElection,
  onDeleteElection
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CANDIDATES' | 'ELECTIONS' | 'VOTERS'>('OVERVIEW');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isAddingElection, setIsAddingElection] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);

  const [newCandidate, setNewCandidate] = useState<Partial<Candidate>>({
    name: '',
    party: '',
    symbol: '🇮🇳',
    constituency: CONSTITUENCIES[0],
    description: ''
  });

  const [newElection, setNewElection] = useState<Partial<Election>>({
    name: '',
    description: '',
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    isActive: true,
    resultsPublished: false
  });

  const turnout = totalVoters > 0 ? ((votesCast / totalVoters) * 100).toFixed(1) : '0.0';

  const handleCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCandidate) {
      onEditCandidate(editingCandidate);
      setEditingCandidate(null);
    } else if (newCandidate.name && newCandidate.party) {
      onAddCandidate({
        ...newCandidate as Candidate,
        id: Math.random().toString(36).substr(2, 9)
      });
      setIsAddingCandidate(false);
      setNewCandidate({
        name: '',
        party: '',
        symbol: '🇮🇳',
        constituency: CONSTITUENCIES[0],
        description: ''
      });
    }
  };

  const handleElectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingElection) {
      onUpdateElection(editingElection);
      setEditingElection(null);
    } else if (newElection.name) {
      onAddElection({
        ...newElection as Election,
        id: Math.random().toString(36).substr(2, 9)
      });
      setIsAddingElection(false);
      setNewElection({
        name: '',
        description: '',
        startAt: new Date().toISOString().slice(0, 16),
        endAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        isActive: true,
        resultsPublished: false
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Tab Switcher */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {(['OVERVIEW', 'CANDIDATES', 'ELECTIONS', 'VOTERS'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-white text-[#000080] shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeTab === 'OVERVIEW' && (
        <>
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
            <div className="lg:col-span-2 space-y-8">
              {/* Constituency Stats Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <BarChart3 size={20} className="text-[#000080]" />
                  <h3 className="font-bold text-gray-800">Voter Turnout by Constituency</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {constituencyStats.map((stat) => (
                    <div key={stat.constituency} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <h4 className="font-bold text-gray-800 mb-3">{stat.constituency}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-medium">Turnout</span>
                          <span className="font-bold text-[#138808]">
                            {stat.total > 0 ? ((stat.voted / stat.total) * 100).toFixed(1) : '0.0'}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-[#138808] h-full transition-all duration-1000" 
                            style={{ width: `${stat.total > 0 ? (stat.voted / stat.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          <span>{stat.voted} Voted</span>
                          <span>{stat.total} Registered</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Health */}
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border border-slate-800">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck size={28} className="text-emerald-400" />
                    <div>
                      <h3 className="text-xl font-bold">Security Infrastructure</h3>
                      <p className="text-slate-500 text-xs">E2EE Protocol Layer 7 Active</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">OPERATIONAL</span>
                    <span className="text-[10px] text-slate-500 mt-1">Last audit: 2 mins ago</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">DB Encryption</p>
                    <p className="text-lg font-mono text-emerald-400">AES-256-GCM</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">System Uptime</p>
                    <p className="text-lg font-mono text-white">99.98%</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Threat Level</p>
                    <p className="text-lg font-mono text-emerald-400">NOMINAL</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-6">
                  <AlertTriangle size={20} className="text-amber-500" />
                  <h3 className="font-bold text-gray-800">Command Center</h3>
                </div>
                <div className="space-y-3">
                  <button className="w-full py-4 bg-slate-50 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 flex items-center justify-center space-x-3 group">
                    <Database size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span>Generate Immutable Backup</span>
                  </button>
                  <button className="w-full py-4 bg-red-50 text-red-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center space-x-3 group">
                    <Ban size={18} className="text-red-400 group-hover:text-red-600 transition-colors" />
                    <span>Emergency System Lock</span>
                  </button>
                </div>
              </div>

              {/* Audit Logs Preview */}
              <div className="bg-[#1a1c1e] text-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-700">
                <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                  <div className="flex items-center space-x-2">
                    <Terminal size={18} className="text-green-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Live Audit Stream</h3>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <div className="p-5 space-y-4 font-mono text-[10px] overflow-y-auto max-h-[400px]">
                  {logs.slice(0, 10).map((log) => (
                    <div key={log.id} className="border-l-2 border-slate-700 pl-4 py-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-500">{log.timestamp}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          log.severity === 'critical' ? 'bg-red-900/40 text-red-400 border border-red-500/20' : 
                          log.severity === 'warning' ? 'bg-amber-900/40 text-amber-400 border border-amber-500/20' : 
                          'bg-blue-900/40 text-blue-400 border border-blue-500/20'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Candidates Management */}
      {activeTab === 'CANDIDATES' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-gray-800">Candidate Registry</h3>
              <p className="text-sm text-gray-500 mt-1">Manage and verify electoral candidates</p>
            </div>
            <button 
              onClick={() => setIsAddingCandidate(true)}
              className="px-6 py-3 bg-[#000080] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-900 transition-all flex items-center space-x-2 shadow-lg"
            >
              <Plus size={16} />
              <span>Register New Candidate</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Symbol</th>
                  <th className="px-8 py-5">Candidate Information</th>
                  <th className="px-8 py-5">Party Alliance</th>
                  <th className="px-8 py-5">Constituency</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((c) => (
                  <tr key={c.id} className="text-sm hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6 text-3xl">{c.symbol}</td>
                    <td className="px-8 py-6">
                       <p className="font-bold text-gray-800 text-lg">{c.name}</p>
                       <p className="text-xs text-gray-500 mt-1 max-w-xs line-clamp-1">{c.description}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {c.party}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin size={14} />
                        <span className="font-bold">{c.constituency}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setEditingCandidate(c)}
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => onDeleteCandidate(c.id)}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Elections Management */}
      {activeTab === 'ELECTIONS' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-gray-800">Election Management</h3>
              <p className="text-sm text-gray-500 mt-1">Create and monitor active voting sessions</p>
            </div>
            <button 
              onClick={() => setIsAddingElection(true)}
              className="px-6 py-3 bg-[#000080] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-900 transition-all flex items-center space-x-2 shadow-lg"
            >
              <Plus size={16} />
              <span>Create New Election</span>
            </button>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {elections.map((e) => (
              <div key={e.id} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl ${
                  e.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'
                }`}>
                  {e.isActive ? 'Active' : 'Inactive'}
                </div>
                <h4 className="text-xl font-black text-gray-800 pr-16">{e.name}</h4>
                <p className="text-xs text-gray-500 mt-2 mb-6 line-clamp-2">{e.description}</p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Calendar size={14} />
                      <span>Start Date</span>
                    </div>
                    <span className="font-bold text-gray-800">{new Date(e.startAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Calendar size={14} />
                      <span>End Date</span>
                    </div>
                    <span className="font-bold text-gray-800">{new Date(e.endAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => onUpdateElection({...e, resultsPublished: !e.resultsPublished})}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        e.resultsPublished 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {e.resultsPublished ? 'Results Published' : 'Publish Results'}
                    </button>
                    <button 
                      onClick={() => onUpdateElection({...e, isActive: !e.isActive})}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        e.isActive 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {e.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => setEditingElection(e)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDeleteElection(e.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voters Management */}
      {activeTab === 'VOTERS' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50">
            <h3 className="text-2xl font-black text-gray-800">Citizen Database</h3>
            <p className="text-sm text-gray-500 mt-1">Review and manage registered voter accounts</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">EPIC / Name</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Constituency</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {voters.map((v) => (
                  <tr key={v.epicNumber} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                       <p className="font-bold text-gray-800">{v.name}</p>
                       <p className="text-[10px] font-mono text-gray-400 mt-0.5 tracking-tighter">{v.epicNumber}</p>
                    </td>
                    <td className="px-8 py-6 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Smartphone size={14} className="text-gray-400" />
                        <span>{v.phoneNumber}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-gray-600">{v.constituency}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        v.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        v.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        v.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end space-x-2">
                        {v.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => onUpdateVoterStatus(v.epicNumber, 'APPROVED')}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Approve Voter"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => onUpdateVoterStatus(v.epicNumber, 'REJECTED')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Reject Voter"
                            >
                              <Ban size={18} />
                            </button>
                          </>
                        )}
                        {v.status === 'APPROVED' && (
                          <button 
                            onClick={() => onUpdateVoterStatus(v.epicNumber, 'DISABLED')}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Disable Account"
                          >
                            <Ban size={18} />
                          </button>
                        )}
                        {v.status === 'DISABLED' && (
                          <button 
                            onClick={() => onUpdateVoterStatus(v.epicNumber, 'APPROVED')}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Enable Account"
                          >
                            <Check size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Modal (Shared for Add/Edit) */}
      {(isAddingCandidate || editingCandidate) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">{editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}</h3>
              <button onClick={() => { setIsAddingCandidate(false); setEditingCandidate(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleCandidateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                  <input
                    required
                    value={editingCandidate ? editingCandidate.name : newCandidate.name}
                    onChange={e => editingCandidate 
                      ? setEditingCandidate({...editingCandidate, name: e.target.value})
                      : setNewCandidate({...newCandidate, name: e.target.value})
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Party</label>
                  <input
                    required
                    value={editingCandidate ? editingCandidate.party : newCandidate.party}
                    onChange={e => editingCandidate 
                      ? setEditingCandidate({...editingCandidate, party: e.target.value})
                      : setNewCandidate({...newCandidate, party: e.target.value})
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Constituency</label>
                  <select
                    value={editingCandidate ? editingCandidate.constituency : newCandidate.constituency}
                    onChange={e => editingCandidate 
                      ? setEditingCandidate({...editingCandidate, constituency: e.target.value})
                      : setNewCandidate({...newCandidate, constituency: e.target.value})
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                  >
                    {CONSTITUENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Symbol</label>
                  <input
                    value={editingCandidate ? editingCandidate.symbol : newCandidate.symbol}
                    onChange={e => editingCandidate 
                      ? setEditingCandidate({...editingCandidate, symbol: e.target.value})
                      : setNewCandidate({...newCandidate, symbol: e.target.value})
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCandidate ? editingCandidate.description : newCandidate.description}
                  onChange={e => editingCandidate 
                    ? setEditingCandidate({...editingCandidate, description: e.target.value})
                    : setNewCandidate({...newCandidate, description: e.target.value})
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#000080] text-white py-4 rounded-2xl font-bold hover:bg-blue-900 shadow-xl transition-all"
              >
                {editingCandidate ? 'Save Changes' : 'Register Candidate'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Election Modal (Shared for Add/Edit) */}
      {(isAddingElection || editingElection) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">{editingElection ? 'Edit Election' : 'Create New Election'}</h3>
              <button onClick={() => { setIsAddingElection(false); setEditingElection(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleElectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Election Name</label>
                <input
                  required
                  value={editingElection ? editingElection.name : newElection.name}
                  onChange={e => editingElection 
                    ? setEditingElection({...editingElection, name: e.target.value})
                    : setNewElection({...newElection, name: e.target.value})
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                  placeholder="e.g. General Election 2026"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingElection ? editingElection.description : newElection.description}
                  onChange={e => editingElection 
                    ? setEditingElection({...editingElection, description: e.target.value})
                    : setNewElection({...newElection, description: e.target.value})
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={editingElection ? editingElection.startAt.slice(0, 16) : newElection.startAt}
                    onChange={e => editingElection 
                      ? setEditingElection({...editingElection, startAt: new Date(e.target.value).toISOString()})
                      : setNewElection({...newElection, startAt: e.target.value})
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={editingElection ? editingElection.endAt.slice(0, 16) : newElection.endAt}
                    onChange={e => editingElection 
                      ? setEditingElection({...editingElection, endAt: new Date(e.target.value).toISOString()})
                      : setNewElection({...newElection, endAt: e.target.value})
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#000080] text-white py-4 rounded-2xl font-bold hover:bg-blue-900 shadow-xl transition-all"
              >
                {editingElection ? 'Save Changes' : 'Create Election'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
