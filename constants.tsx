
import React from 'react';
import { Candidate, ElectionSchedule } from './types';

export const CONSTITUENCIES = [
  "New Delhi",
  "Mumbai South",
  "Bangalore Central",
  "Kolkata North",
  "Chennai South"
];

export const ELECTION_SCHEDULE: ElectionSchedule = {
  name: "General Assembly 2026",
  description: "Multi-constituency general election for major metropolitan and regional seats.",
  startAt: "2026-04-14T08:00:00.000Z",
  endAt: "2026-04-14T18:00:00.000Z",
  resultsPublishAt: "2026-04-14T20:00:00.000Z",
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
