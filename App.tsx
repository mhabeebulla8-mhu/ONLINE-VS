
import React, { useState, useEffect } from 'react';
import Welcome from './components/Welcome';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import VotingBallot from './components/VotingBallot';
import ResultsDashboard from './components/ResultsDashboard';
import AIAssistant from './components/AIAssistant';
import { ViewState, Voter, Candidate, Admin, AuditLog, ElectionStatus, ElectionSchedule, ConstituencyStat } from './types';
import { ELECTION_SCHEDULE } from './constants';
import { CheckCircle, Info, Vote, History, MapPin, Award, Sparkles, MessageSquare } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('WELCOME');
  const [currentUser, setCurrentUser] = useState<Voter | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<{ name: string; votes: number; party: string }[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<{ totalRegisteredVoters: number; totalVotesCast: number; constituencyStats: ConstituencyStat[] }>({ 
    totalRegisteredVoters: 0, 
    totalVotesCast: 0,
    constituencyStats: []
  });

  const getElectionStatus = (schedule: ElectionSchedule): ElectionStatus => {
    const now = new Date();
    const start = new Date(schedule.startAt);
    const end = new Date(schedule.endAt);
    const resultsAt = new Date(schedule.resultsPublishAt);

    const startsIn = start > now ? `${Math.ceil((start.getTime() - now.getTime()) / 3600000)}h` : 'Now';
    const endsIn = end > now ? `${Math.ceil((end.getTime() - now.getTime()) / 3600000)}h` : 'Closed';
    const resultsIn = resultsAt > now ? `${Math.ceil((resultsAt.getTime() - now.getTime()) / 3600000)}h` : 'Published';

    let phase: ElectionStatus['phase'] = 'UPCOMING';
    if (now < start) phase = 'UPCOMING';
    else if (now >= start && now <= end) phase = 'OPEN';
    else if (now > end && now < resultsAt) phase = 'RESULTS_PENDING';
    else phase = 'RESULTS_PUBLISHED';

    return {
      phase,
      isVotingOpen: phase === 'OPEN',
      isResultsPublished: phase === 'RESULTS_PUBLISHED',
      startsIn,
      endsIn,
      resultsIn
    };
  };

  const electionStatus = getElectionStatus(ELECTION_SCHEDULE);

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/candidates');
      const data = await res.json();
      setCandidates(data);
      setResults(data.map((c: any) => ({ name: c.name, votes: c.votes, party: c.party })));
    } catch (error) {
      console.error("Failed to fetch candidates", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats({
        totalRegisteredVoters: data.totalRegisteredVoters,
        totalVotesCast: data.totalVotesCast,
        constituencyStats: data.constituencyStats || []
      });
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchLogs();
    fetchStats();
  }, []);

  const addLog = async (action: string, details: string, severity: 'info' | 'warning' | 'critical' = 'info') => {
    // In a real app, we might want an API to add logs, but for now we'll just update local state
    // and let the server handle logs for critical actions like voting.
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      action,
      details,
      severity
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleVoterLogin = async (epic: string, aadhaar: string, pin: string) => {
    try {
      // Handle OTP-based login differently
      if (epic === 'OTP_AUTH') {
        // For OTP login, find voter by Aadhaar number
        const res = await fetch('/api/login/voter-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aadhaar })
        });
        if (res.ok) {
          const voter = await res.json();
          setCurrentUser({ ...voter, isVerified: true });
          setCurrentAdmin(null);
          setCurrentView('DASHBOARD');
          addLog('VOTER_AUTH_OTP', `Aadhaar ${aadhaar.substring(0, 4)}**** authenticated via OTP.`, 'info');
        } else {
          alert("Invalid credentials - Aadhaar not found in system");
        }
        return;
      }

      // Regular EPIC + PIN login
      const res = await fetch('/api/login/voter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epic, pin })
      });
      if (res.ok) {
        const voter = await res.json();
        setCurrentUser({ ...voter, isVerified: true });
        setCurrentAdmin(null);
        setCurrentView('DASHBOARD');
        addLog('VOTER_AUTH', `EPIC ${epic} authenticated.`, 'info');
      } else {
        alert("Invalid credentials");
      }
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed - please try again");
    }
  };

  const handleAdminLogin = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/login/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const admin = await res.json();
        setCurrentAdmin(admin);
        setCurrentUser(null);
        setCurrentView('ADMIN_DASHBOARD');
        addLog('ADMIN_AUTH', `Official session started for: ${username}`, 'warning');
      } else {
        alert("Invalid official credentials");
      }
    } catch (error) {
      console.error("Admin login failed", error);
    }
  };

  const handleVoterRegister = async (data: { name: string; epic: string; aadhaar: string; constituency: string; pin: string }) => {
    try {
      const res = await fetch('/api/register/voter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        addLog('VOTER_REG', `New citizen registered: ${data.name}`, 'info');
        setCurrentView('LOGIN');
      } else {
        alert("Registration failed");
      }
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  const handleAdminRegister = async (data: { username: string; email: string; pass: string; role: string }) => {
    try {
      const res = await fetch('/api/register/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        addLog('ADMIN_REG', `New official onboarded: ${data.username} (${data.role})`, 'warning');
        setCurrentView('LOGIN');
      } else {
        alert("Admin registration failed");
      }
    } catch (error) {
      console.error("Admin registration failed", error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentAdmin(null);
    setCurrentView('WELCOME');
  };

  const handleCastVote = async (candidateId: string) => {
    if (!electionStatus.isVotingOpen) {
      alert(`Voting is not open right now. Election status: ${electionStatus.phase}`);
      return;
    }

    if (currentUser) {
      try {
        const res = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voterEpic: currentUser.epicNumber, candidateId })
        });
        if (res.ok) {
          addLog('BALLOT_CAST', `Ballot successfully recorded.`, 'info');
          setCurrentUser({ ...currentUser, hasVoted: true });
          fetchCandidates(); // Refresh results
          fetchStats(); // Refresh stats
          setCurrentView('RESULTS');
        } else {
          alert("Voting failed");
        }
      } catch (error) {
        console.error("Voting failed", error);
      }
    }
  };

  const handleAddCandidate = async (newCandidate: Candidate) => {
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCandidate)
      });
      if (res.ok) {
        fetchCandidates();
        addLog('CONFIG_CHANGE', `Added candidate: ${newCandidate.name}`, 'warning');
      }
    } catch (error) {
      console.error("Failed to add candidate", error);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCandidates();
        addLog('CONFIG_CHANGE', `Removed candidate ID: ${id}`, 'critical');
      }
    } catch (error) {
      console.error("Failed to delete candidate", error);
    }
  };

  // Entry Point view
  if (currentView === 'WELCOME') {
    return <Welcome onStart={() => setCurrentView('LOGIN')} />;
  }

  if (currentView === 'LOGIN') {
    return (
      <Login 
        onVoterLogin={handleVoterLogin} 
        onAdminLogin={handleAdminLogin} 
        onGoToRegister={() => setCurrentView('REGISTER')}
      />
    );
  }

  if (currentView === 'REGISTER') {
    return (
      <Register 
        onVoterRegister={handleVoterRegister} 
        onAdminRegister={handleAdminRegister}
        onBackToLogin={() => setCurrentView('LOGIN')}
      />
    );
  }

  return (
    <Layout 
        currentView={currentView} 
        setView={setCurrentView} 
        voterName={currentUser?.name}
        onLogout={handleLogout}
        isAdmin={!!currentAdmin}
        stats={stats}
      >
      {currentView === 'DASHBOARD' && currentUser && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF9933]/5 rounded-full -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-extrabold text-gray-800 mb-2">Welcome Back, Citizen</h2>
              <p className="text-gray-500 mb-8 max-w-2xl text-lg">Your voice matters. Exercise your democratic right to shape the future of India.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-2xl flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Constituency</p>
                    <p className="text-lg font-bold text-gray-800">{currentUser.constituency}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${currentUser.hasVoted ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Status</p>
                    <p className={`text-lg font-bold ${currentUser.hasVoted ? 'text-green-600' : 'text-orange-600'}`}>
                      {currentUser.hasVoted ? 'Voted' : 'Eligible'}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <Award size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">ID Verified</p>
                    <p className="text-lg font-bold text-gray-800">{currentUser.epicNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">Election window</p>
                <h3 className="text-2xl font-black text-gray-800">{ELECTION_SCHEDULE.name}</h3>
                <p className="text-sm text-gray-500 mt-2">{ELECTION_SCHEDULE.description}</p>
              </div>
              <div className="text-left lg:text-right space-y-1">
                <p className="text-sm text-gray-500">Starts: {new Date(ELECTION_SCHEDULE.startAt).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Ends: {new Date(ELECTION_SCHEDULE.endAt).toLocaleString()}</p>
                <p className={`mt-2 text-sm font-semibold ${electionStatus.isVotingOpen ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {electionStatus.phase.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {!currentUser.hasVoted ? (
            <div className="bg-[#138808] p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-6">
                <div className="p-3 bg-white/20 rounded-full">
                  <Vote size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Cast Your Vote</h3>
                  <p className="opacity-90 mt-1">Select your representative for {currentUser.constituency}.</p>
                </div>
              </div>
              <button onClick={() => setCurrentView('BALLOT')} className="bg-white text-[#138808] px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95">
                Go to Ballot
              </button>
            </div>
          ) : (
             <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <History size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-900">Vote Recorded</h3>
                  <p className="text-blue-700/80 mt-1">Thank you for participating. Monitor live results below.</p>
                </div>
              </div>
              <button onClick={() => setCurrentView('RESULTS')} className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all">
                View Live Tally
              </button>
            </div>
          )}

          {/* Voter Information Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-6">
                <Info size={20} className="text-[#000080]" />
                <h3 className="font-bold text-gray-800">Your Voting Guide</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                  <div className="w-8 h-8 bg-blue-50 text-[#000080] rounded-lg flex items-center justify-center shrink-0">1</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600">Verify Candidate Profile</p>
                    <p className="text-xs text-gray-500">Read manifestos and party backgrounds before deciding.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                  <div className="w-8 h-8 bg-orange-50 text-[#FF9933] rounded-lg flex items-center justify-center shrink-0">2</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 group-hover:text-[#FF9933]">OTP Verification</p>
                    <p className="text-xs text-gray-500">Keep your registered mobile number handy for final confirmation.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                  <div className="w-8 h-8 bg-green-50 text-[#138808] rounded-lg flex items-center justify-center shrink-0">3</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 group-hover:text-[#138808]">Privacy First</p>
                    <p className="text-xs text-gray-500">Your vote is encrypted and anonymous. No one can see who you voted for.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform">
                <Sparkles size={80} />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <Sparkles size={20} className="text-amber-400" />
                  <span>AI Election Insights</span>
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Get personalized insights about candidates in {currentUser.constituency} and overall election trends powered by Gemini AI.
                </p>
                <button 
                  onClick={() => setCurrentView('AI_ASSISTANT')}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center space-x-2"
                >
                  <span>Launch Assistant</span>
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'ADMIN_DASHBOARD' && currentAdmin && (
        <AdminDashboard 
          candidates={candidates}
          onAddCandidate={handleAddCandidate}
          onDeleteCandidate={handleDeleteCandidate}
          totalVoters={stats.totalRegisteredVoters}
          votesCast={stats.totalVotesCast}
          logs={logs}
          constituencyStats={stats.constituencyStats}
        />
      )}

      {currentView === 'BALLOT' && currentUser && (
        <VotingBallot 
          candidates={candidates} 
          onVote={handleCastVote}
          voterConstituency={currentUser.constituency}
          electionStatus={electionStatus}
          schedule={ELECTION_SCHEDULE}
        />
      )}

      {currentView === 'RESULTS' && (
        <ResultsDashboard 
          data={results} 
          schedule={ELECTION_SCHEDULE}
          electionStatus={electionStatus}
          candidates={candidates}
        />
      )}
      {currentView === 'AI_ASSISTANT' && <AIAssistant />}
    </Layout>
  );
};

export default App;
