
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

export interface Election {
  id: string;
  name: string;
  description: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  resultsPublished: boolean;
}

export interface Voter {
  epicNumber: string;
  phoneNumber: string;
  name: string;
  constituency: string;
  hasVoted: boolean;
  isVerified: boolean;
  phoneVerified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';
}

export interface Admin {
  id: string;
  username: string;
  role: 'ELECTION_OFFICER' | 'SYSTEM_ADMIN' | 'AUDITOR';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ConstituencyStat {
  constituency: string;
  total: number;
  voted: number;
}

export type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'BALLOT' | 'VERIFICATION' | 'RESULTS' | 'AI_ASSISTANT' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
