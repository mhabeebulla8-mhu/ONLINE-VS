
export interface Candidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
  description: string;
  constituency: string;
}

export type ElectionPhase = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'RESULTS_PENDING' | 'RESULTS_PUBLISHED';

export interface ElectionSchedule {
  name: string;
  startAt: string;
  endAt: string;
  resultsPublishAt: string;
  description: string;
  constituencies: string[];
}

export interface ElectionStatus {
  phase: ElectionPhase;
  isVotingOpen: boolean;
  isResultsPublished: boolean;
  startsIn: string;
  endsIn: string;
  resultsIn: string;
}

export interface Voter {
  epicNumber: string;
  aadhaarNumber: string;
  name: string;
  constituency: string;
  hasVoted: boolean;
  isVerified: boolean;
}

export interface Admin {
  id: string;
  username: string;
  role: 'ELECTION_OFFICER' | 'SYSTEM_ADMIN';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'BALLOT' | 'VERIFICATION' | 'RESULTS' | 'AI_ASSISTANT' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
