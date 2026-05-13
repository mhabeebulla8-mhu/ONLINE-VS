
import React from 'react';
import { Candidate, ElectionSchedule } from './types';

export const CONSTITUENCIES = [
  "New Delhi",
  "Mumbai South",
  "Bangalore Central",
  "Kolkata North",
  "Chennai South"
];

const now = new Date();
const start = new Date(now.getTime() - 3600000); // 1 hour ago
const end = new Date(now.getTime() + 86400000); // 24 hours from now
const results = new Date(now.getTime() + 172800000); // 48 hours from now

export const ELECTION_SCHEDULE: ElectionSchedule = {
  name: "General Assembly 2026",
  description: "Multi-constituency general election for major metropolitan and regional seats.",
  startAt: start.toISOString(),
  endAt: end.toISOString(),
  resultsPublishAt: results.toISOString(),
  constituencies: CONSTITUENCIES
};

export const CANDIDATES: Candidate[] = [
  {
    id: "c1",
    name: "Rajesh Kumar",
    party: "National Progress Party (NPP)",
    symbol: "⚡",
    description: "Focusing on digital infrastructure and renewable energy.",
    constituency: "New Delhi"
  },
  {
    id: "c2",
    name: "Sunita Deshmukh",
    party: "People's Democratic Alliance (PDA)",
    symbol: "🌾",
    description: "Committed to agricultural reforms and rural education.",
    constituency: "New Delhi"
  },
  {
    id: "c3",
    name: "Arjun Singh",
    party: "Independent",
    symbol: "💡",
    description: "Advocating for local municipal transparency.",
    constituency: "New Delhi"
  },
  {
    id: "c4",
    name: "Vikram Malhotra",
    party: "Urban Development Party (UDP)",
    symbol: "🏗️",
    description: "Modernizing urban transport and smart cities.",
    constituency: "Mumbai South"
  },
  {
    id: "c5",
    name: "Priya Iyer",
    party: "Women's Rights Front (WRF)",
    symbol: "🌸",
    description: "Empowering women through skill development.",
    constituency: "Mumbai South"
  }
];

export const APP_THEME = {
  saffron: '#FF9933',
  white: '#FFFFFF',
  green: '#138808',
  navy: '#000080'
};
