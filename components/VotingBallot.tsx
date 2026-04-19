
import React, { useState } from 'react';
import { Candidate, ElectionSchedule, ElectionStatus } from '../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface VotingBallotProps {
  candidates: Candidate[];
  onVote: (candidateId: string) => void;
  voterConstituency: string;
  electionStatus: ElectionStatus;
  schedule: ElectionSchedule;
}

const VotingBallot: React.FC<VotingBallotProps> = ({ candidates, onVote, voterConstituency, electionStatus, schedule }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedConstituency, setSelectedConstituency] = useState(voterConstituency);

  const constituencyOptions = Array.from(new Set(candidates.map(c => c.constituency)));
  const filteredCandidates = candidates.filter(c => c.constituency === selectedConstituency);
  const selectedCandidate = filteredCandidates.find(c => c.id === selectedId);
  const canReview = !!selectedCandidate && electionStatus.isVotingOpen && selectedConstituency === voterConstituency;

  const handleCastVote = () => {
    if (selectedId && electionStatus.isVotingOpen) {
      onVote(selectedId);
    }
  };

  if (isReviewing && selectedCandidate) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-xl border-4 border-[#FF9933]">
        <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-800">Review Your Ballot</h2>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-center">
          <div className="text-6xl mb-4">{selectedCandidate.symbol}</div>
          <p className="text-gray-500 text-sm uppercase tracking-widest">Selected candidate</p>
          <h3 className="text-2xl font-bold text-[#000080] mt-1">{selectedCandidate.name}</h3>
          <p className="text-green-700 font-semibold mt-1">{selectedCandidate.party}</p>
          <p className="text-sm text-gray-500 mt-4">Constituency: {selectedConstituency}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
            <p className="text-sm font-bold text-emerald-700 uppercase tracking-[0.25em] mb-2">Vote Preview</p>
            <p className="text-sm text-gray-600">Review this choice carefully before confirming. If you need to change your selection, cancel and choose another candidate.</p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-500 mt-1" size={18} />
              <div>
                <p className="text-sm font-semibold text-amber-700">Note</p>
                <p className="text-sm text-amber-800">You can cancel the vote while previewing, but once the vote is confirmed it is final.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => { setIsReviewing(false); }}
            className="py-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Back to Ballot
          </button>
          <button
            onClick={handleCastVote}
            className="py-4 rounded-xl font-bold text-white bg-[#138808] hover:bg-[#0f6b06] shadow-lg shadow-green-200 transition-all transform hover:scale-[1.02]"
          >
            Confirm and Submit Vote
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Digital Ballot Box</h2>
            <p className="text-gray-500">Select your representative for <span className="font-semibold text-[#000080]">{voterConstituency}</span>.</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">Election Status</p>
            <p className={`text-lg font-bold ${electionStatus.isVotingOpen ? 'text-emerald-600' : 'text-amber-600'}`}>
              {electionStatus.phase.replace('_', ' ')}
            </p>
            <p className="text-xs text-gray-500 mt-1">Results publish in {electionStatus.resultsIn}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold mb-2">Election schedule</p>
            <p className="text-sm text-gray-600">Starts at {new Date(schedule.startAt).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Ends at {new Date(schedule.endAt).toLocaleString()}</p>
          </div>
          <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold mb-2">Assigned constituency</p>
            <p className="text-sm text-gray-600">{voterConstituency}</p>
            <p className="text-xs text-gray-500 mt-3">You may browse other constituencies, but voting is limited to your assigned seat.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Itemized ballot view</label>
          <select
            value={selectedConstituency}
            onChange={(e) => { setSelectedConstituency(e.target.value); setSelectedId(null); setIsReviewing(false); }}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#000080] outline-none"
          >
            {constituencyOptions.map(constituency => (
              <option key={constituency} value={constituency}>{constituency}</option>
            ))}
          </select>
          {selectedConstituency !== voterConstituency && (
            <p className="mt-3 text-sm text-amber-700">You are currently viewing another constituency. Select your assigned constituency to cast your vote.</p>
          )}
        </div>

        {!electionStatus.isVotingOpen && (
          <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 text-amber-900">
            <p className="font-semibold">Voting is currently unavailable.</p>
            <p className="mt-2 text-sm text-amber-800">Voting opens at {new Date(schedule.startAt).toLocaleString()} and closes at {new Date(schedule.endAt).toLocaleString()}.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => setSelectedId(candidate.id)}
              className={`cursor-pointer group relative bg-white p-5 rounded-2xl border-2 transition-all flex items-center justify-between hover:shadow-md ${
                selectedId === candidate.id 
                  ? 'border-[#FF9933] bg-orange-50/30' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {candidate.symbol}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{candidate.name}</h3>
                  <p className="text-[#138808] font-medium text-sm">{candidate.party}</p>
                  <p className="text-gray-400 text-xs mt-1 max-w-md hidden md:block">{candidate.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {selectedId === candidate.id && (
                  <CheckCircle2 className="text-[#138808]" size={28} />
                )}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  selectedId === candidate.id ? 'bg-[#FF9933] border-[#FF9933]' : 'border-gray-300'
                }`}>
                   {selectedId === candidate.id && <div className="w-3 h-3 bg-white rounded-full"></div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedCandidate && (
          <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">Selected candidate</p>
                <h3 className="text-2xl font-black text-gray-800 mt-2">{selectedCandidate.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedCandidate.party}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Your assigned seat</p>
                <p className="text-sm font-semibold text-gray-800">{selectedConstituency}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                disabled={!canReview}
                onClick={() => setIsReviewing(true)}
                className={`py-4 rounded-2xl font-bold text-white transition-all ${
                  canReview ? 'bg-[#000080] hover:bg-blue-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Preview Vote
              </button>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="py-4 rounded-2xl font-bold text-[#000080] bg-white border border-[#000080] hover:bg-[#eff6ff] transition-all"
              >
                Cancel Selection
              </button>
            </div>
            {!canReview && selectedConstituency !== voterConstituency && (
              <p className="mt-4 text-sm text-amber-700">Switch back to your assigned constituency to cast a valid vote.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingBallot;
