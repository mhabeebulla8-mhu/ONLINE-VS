
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ElectionSchedule, ElectionStatus, Candidate } from '../types';
import { CONSTITUENCIES } from '../constants';

interface ResultsDashboardProps {
  data: { name: string; votes: number; party: string }[];
  schedule: ElectionSchedule;
  electionStatus: ElectionStatus;
  candidates: Candidate[];
  isAdmin?: boolean;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ data, schedule, electionStatus, candidates, isAdmin = false }) => {
  const [selectedConstituency, setSelectedConstituency] = useState<string>('All');
  const COLORS = ['#FF9933', '#138808', '#000080', '#FFCC00', '#666666'];

  const showResults = isAdmin || electionStatus.isResultsPublished;

  const filteredCandidates = selectedConstituency === 'All' 
    ? data 
    : data.filter(d => candidates.find(c => c.name === d.name)?.constituency === selectedConstituency);

  const totalVotes = filteredCandidates.reduce((acc, curr) => acc + curr.votes, 0);
  const resultsLabel = electionStatus.isResultsPublished ? 'Official results are published' : (isAdmin ? 'Live internal tally' : 'Results pending publication');

  if (!showResults) {
     return (
       <div className="space-y-8 animate-fadeIn">
         <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100 px-6">
           <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <span className="text-4xl">📊</span>
           </div>
           <h2 className="text-3xl font-black text-gray-800 tracking-tight mb-4">Results are being processed</h2>
           <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
             Results will be published officially after election completion and administrative approval. 
           </p>
           <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 max-w-lg mx-auto">
             <p className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">Scheduled Publication</p>
             <p className="text-2xl font-black text-[#000080]">{new Date(schedule.resultsPublishAt).toLocaleString()}</p>
           </div>
         </div>
       </div>
     );
   }

   return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Election Results</h2>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Filter by Constituency:</span>
          <select 
            value={selectedConstituency}
            onChange={(e) => setSelectedConstituency(e.target.value)}
            className="bg-gray-50 border-none rounded-xl text-sm font-bold text-[#000080] focus:ring-0 cursor-pointer"
          >
            <option value="All">All Regions</option>
            {CONSTITUENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">Election</p>
          <h3 className="text-2xl font-black text-gray-800 mt-3">{schedule.name}</h3>
          <p className="text-sm text-gray-500 mt-2">{schedule.description}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">Results publication</p>
          <p className="text-sm text-slate-600 mt-3">Scheduled at {new Date(schedule.resultsPublishAt).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-3">Status: <span className={`font-semibold ${electionStatus.isResultsPublished ? 'text-emerald-600' : 'text-amber-600'}`}>{electionStatus.phase.replace('_', ' ')}</span></p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">Turnout snapshot</p>
          <h3 className="text-3xl font-black text-gray-800 mt-3">{totalVotes.toLocaleString()}</h3>
          <p className="text-sm text-gray-500 mt-2">Total confirmed ballots recorded</p>
        </div>
      </div>

      <div className="bg-[#EFF6FF] border-l-4 border-[#000080] p-6 rounded-3xl">
        <p className="text-sm font-bold text-[#000080]">{resultsLabel}</p>
        <p className="text-sm text-slate-600 mt-2">Official publication of the results is set for {new Date(schedule.resultsPublishAt).toLocaleString()}. Until then, this is the current vote count snapshot.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Vote Count by Candidate</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredCandidates}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                  {filteredCandidates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Vote Share Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredCandidates}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="votes"
                >
                  {filteredCandidates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {filteredCandidates.map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <span className="text-xs text-gray-600 truncate">{item.name} ({item.party})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Detailed Tally</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b">
                <th className="pb-3">Candidate</th>
                <th className="pb-3">Party</th>
                <th className="pb-3 text-right">Votes</th>
                <th className="pb-3 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...filteredCandidates].sort((a, b) => b.votes - a.votes).map((item) => {
                const total = filteredCandidates.reduce((acc, curr) => acc + curr.votes, 0);
                const percentage = total > 0 ? ((item.votes / total) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="py-4 text-sm text-gray-600">{item.party}</td>
                    <td className="py-4 text-right font-mono font-bold">{item.votes.toLocaleString()}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#138808]" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-10">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;

