import express from "express";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import crypto from "crypto";
import axios from "axios";

// ===== HELPERS =====

const hashPin = (pin: string) => crypto.createHash('sha256').update(pin).digest('hex');
const hashOtp = (otp: string) => crypto.createHash('sha256').update(otp).digest('hex');
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ===== FAST2SMS =====

async function sendFast2SMS(phoneNumber: string, otp: string) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/\s+/g, '');

  if (!apiKey || apiKey === 'your_fast2sms_api_key') {
    console.warn(`[MOCK SMS] OTP ${otp} sent to ${cleanPhone}`);
    return { success: true, message: 'OTP sent (Development Mode)' };
  }

  try {
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'otp',
      variables_values: otp,
      numbers: cleanPhone,
    }, {
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Fast2SMS API Error:', error.response?.data || error.message);
    throw new Error('Failed to send SMS. Please try again later.');
  }
}

// ===== NOTIFICATION HELPERS =====

async function sendSmsNotification(to: string, message: string) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const cleanPhone = to.replace(/^\+91/, '').replace(/\s+/g, '');

  if (apiKey && apiKey !== 'your_fast2sms_api_key') {
    try {
      await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        route: 'v3',
        sender_id: 'TXTIND',
        message,
        language: 'english',
        flash: 0,
        numbers: cleanPhone,
      }, {
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      console.error('SMS Notification Failed:', error.response?.data || error.message);
    }
  } else {
    console.log(`[MOCK SMS] To: ${cleanPhone}, Message: ${message}`);
  }
}

// ===== GEMINI AI ASSISTANT =====

async function getElectionGuidance(userMessage: string, history: Array<{role: string; text: string}>) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  
  // Local fallback if no API key
  if (!apiKey) {
    const normalized = userMessage.trim().toLowerCase();
    if (/hello|hi|namaste|hey/.test(normalized)) {
      return `Namaste! I am BharatVote Buddy. Ask me about voter registration, Mobile OTP verification, the voting process, or how to view election results.`;
    }
    if (/how.*vote|vote process/.test(normalized)) {
      return `To vote in BharatVote, log in as a citizen, verify your identity using Mobile OTP, and access the ballot for your constituency. Select your preferred candidate, review your choice carefully, then confirm and submit.`;
    }
    if (/rights|constitution|324/.test(normalized)) {
      return `Indian citizens have the right to vote under Articles 324-329 of the Constitution. The Election Commission of India administers inclusive, free and fair elections.`;
    }
    return `I am BharatVote Buddy. You can ask me about voting rights, Mobile OTP login, candidate information, voter registration, and how the ballot works.`;
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        parts: [{ text: msg.text }]
      })),
      config: {
        systemInstruction: `You are BharatVote Buddy, an official AI assistant for the Indian Online Voting System. 
        Your goal is to help Indian citizens understand the voting process, provide information about their rights (Articles 324-329 of the Constitution), 
        explain how electronic voting works, and offer general information about democratic processes. 
        Keep responses professional, patriotic, neutral, and helpful. 
        Do not endorse any specific political party or candidate. 
        If asked about current events, use search to provide accurate data.`,
        tools: [{ googleSearch: {} }]
      }
    });

    const response = await chat.sendMessage({ message: userMessage });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let finalOutput = response.text || "";
    
    if (groundingChunks && groundingChunks.length > 0) {
      const sources = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => chunk.web);
      
      if (sources.length > 0) {
        finalOutput += "\n\nSources for further reading:\n";
        sources.forEach((source: any) => {
          finalOutput += `- [${source.title}](${source.uri})\n`;
        });
      }
    }

    return finalOutput;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting to the election assistant right now. Please try again.";
  }
}

// ===== DATABASE SINGLETON =====

let dbInstance: Database | null = null;

async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dbPath = process.env.DATABASE_PATH || "/tmp/database.sqlite";
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Check and migrate voters table if necessary
  const tableInfo = await db.all("PRAGMA table_info(voters)");
  const columnNames = tableInfo.map((c: any) => c.name);

  if (columnNames.length > 0) {
    if (columnNames.includes('aadhaarNumber') && !columnNames.includes('phoneNumber')) {
      await db.exec("ALTER TABLE voters RENAME COLUMN aadhaarNumber TO phoneNumber");
    }
    if (!columnNames.includes('phoneVerified')) {
      await db.exec("ALTER TABLE voters ADD COLUMN phoneVerified BOOLEAN DEFAULT 0");
    }
    if (!columnNames.includes('status')) {
      await db.exec("ALTER TABLE voters ADD COLUMN status TEXT DEFAULT 'PENDING'");
    }
    if (!columnNames.includes('registeredAt')) {
      await db.exec("ALTER TABLE voters ADD COLUMN registeredAt TEXT");
    }
  }

  // Check and migrate admins table
  const adminTableInfo = await db.all("PRAGMA table_info(admins)");
  const adminColumnNames = adminTableInfo.map((c: any) => c.name);
  if (adminColumnNames.length > 0) {
    if (!adminColumnNames.includes('email')) {
      await db.exec("ALTER TABLE admins ADD COLUMN email TEXT");
    }
    if (!adminColumnNames.includes('phone')) {
      await db.exec("ALTER TABLE admins ADD COLUMN phone TEXT");
    }
  }

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      party TEXT NOT NULL,
      symbol TEXT NOT NULL,
      description TEXT,
      constituency TEXT NOT NULL,
      votes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS voters (
      epicNumber TEXT PRIMARY KEY,
      phoneNumber TEXT NOT NULL,
      name TEXT NOT NULL,
      constituency TEXT NOT NULL,
      hasVoted BOOLEAN DEFAULT 0,
      pin TEXT NOT NULL,
      phoneVerified BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      registeredAt TEXT
    );

    CREATE TABLE IF NOT EXISTS elections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      startAt TEXT NOT NULL,
      endAt TEXT NOT NULL,
      resultsPublished BOOLEAN DEFAULT 0,
      isActive BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      severity TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS otp_requests (
      phoneNumber TEXT PRIMARY KEY,
      otpHash TEXT NOT NULL,
      expiry INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      verified BOOLEAN DEFAULT 0
    );
  `);

  // Seed admin
  const adminCount = await db.get("SELECT COUNT(*) as count FROM admins");
  if (adminCount.count === 0) {
    await db.run(
      "INSERT INTO admins (id, username, password, role) VALUES (?, ?, ?, ?)",
      ['admin_01', 'official_admin', 'Pass123!@#', 'SYSTEM_ADMIN']
    );
  }

  // Seed candidates
  const candidateCount = await db.get("SELECT COUNT(*) as count FROM candidates");
  if (candidateCount.count === 0) {
    const initialCandidates = [
      { id: '1', name: 'Rajesh Kumar', party: 'Progressive Party', symbol: '🚜', constituency: 'New Delhi', description: 'Focusing on rural development and education.' },
      { id: '2', name: 'Sunita Sharma', party: 'Unity Alliance', symbol: '☀️', constituency: 'Mumbai South', description: 'Committed to urban infrastructure and healthcare.' },
      { id: '3', name: 'Arjun Singh', party: 'People\'s Front', symbol: '🐘', constituency: 'Bangalore Central', description: 'Advocating for digital literacy and job creation.' }
    ];
    for (const c of initialCandidates) {
      await db.run(
        "INSERT INTO candidates (id, name, party, symbol, constituency, description) VALUES (?, ?, ?, ?, ?, ?)",
        [c.id, c.name, c.party, c.symbol, c.constituency, c.description]
      );
    }
  }

  // Seed test voters (EPIC starting with TEST/VOTE bypasses OTP)
  const voterCount = await db.get("SELECT COUNT(*) as count FROM voters");
  if (voterCount.count === 0) {
    const testVoters = [
      { epic: 'VOTE123456', phone: '9876543210', name: 'Sample Voter', constituency: 'New Delhi', pin: '4321' },
      { epic: 'TEST999999', phone: '9999999999', name: 'John Doe', constituency: 'New Delhi', pin: '1234' },
      { epic: 'TEST000001', phone: '9000000001', name: 'Aarav Patel', constituency: 'New Delhi', pin: '1111' },
      { epic: 'TEST000002', phone: '9000000002', name: 'Priya Mehta', constituency: 'Mumbai South', pin: '2222' },
      { epic: 'TEST000003', phone: '9000000003', name: 'Vikram Reddy', constituency: 'Bangalore Central', pin: '3333' },
      { epic: 'TEST000004', phone: '9000000004', name: 'Anjali Nair', constituency: 'New Delhi', pin: '4444' },
      { epic: 'TEST000005', phone: '9000000005', name: 'Rohit Gupta', constituency: 'Mumbai South', pin: '5555' },
    ];
    for (const v of testVoters) {
      await db.run(
        "INSERT INTO voters (epicNumber, phoneNumber, name, constituency, pin, status, phoneVerified) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [v.epic, v.phone, v.name, v.constituency, hashPin(v.pin), 'APPROVED', 1]
      );
    }
  }

  // Seed election
  const electionCount = await db.get("SELECT COUNT(*) as count FROM elections");
  if (electionCount.count === 0) {
    await db.run(
      "INSERT INTO elections (id, name, description, startAt, endAt, isActive) VALUES (?, ?, ?, ?, ?, ?)",
      ['election_1', 'General Election 2026', 'National level voting for parliamentary seats.', new Date().toISOString(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 1]
    );
  }

  dbInstance = db;
  console.log(`Database initialized at: ${dbPath}`);
  return db;
}

// ===== EXPRESS APP =====

const app = express();
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- OTP ROUTES ---

app.post("/api/auth/send-otp", async (req, res) => {
  const { phoneNumber, name, epicNumber } = req.body;
  
  if (!phoneNumber || !/^\d{10}$/.test(phoneNumber.replace(/^\+91/, ''))) {
    return res.status(400).json({ error: "Invalid Indian phone number. Please enter 10 digits." });
  }

  const db = await getDb();

  if (epicNumber) {
    const existingVoter = await db.get("SELECT epicNumber FROM voters WHERE epicNumber = ?", [epicNumber]);
    if (existingVoter) {
      return res.status(400).json({ error: "EPIC Number is already registered. Please login instead." });
    }
  }

  const otp = generateOtp();
  const otpHash2 = hashOtp(otp);
  const expiry = Date.now() + 5 * 60 * 1000;

  try {
    await db.run(
      `INSERT OR REPLACE INTO otp_requests (phoneNumber, otpHash, expiry, attempts, verified) 
       VALUES (?, ?, ?, 0, 0)`,
      [phoneNumber, otpHash2, expiry]
    );

    await sendFast2SMS(phoneNumber, otp);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("OTP Send Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: "Phone number and OTP are required" });
  }

  const db = await getDb();

  try {
    const request = await db.get("SELECT * FROM otp_requests WHERE phoneNumber = ?", [phoneNumber]);

    if (!request) {
      return res.status(404).json({ error: "No OTP request found for this number" });
    }

    if (Date.now() > request.expiry) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (request.attempts >= 5) {
      return res.status(403).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    const isMatch = hashOtp(otp) === request.otpHash;

    if (!isMatch) {
      await db.run("UPDATE otp_requests SET attempts = attempts + 1 WHERE phoneNumber = ?", [phoneNumber]);
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await db.run("UPDATE otp_requests SET verified = 1 WHERE phoneNumber = ?", [phoneNumber]);
    res.json({ success: true, message: "Phone verified successfully" });
  } catch (error) {
    console.error("OTP Verify Error:", error);
    res.status(500).json({ error: "Internal server error during verification" });
  }
});

// --- CANDIDATE ROUTES ---

app.get("/api/candidates", async (_req, res) => {
  const db = await getDb();
  const candidates = await db.all("SELECT * FROM candidates");
  res.json(candidates);
});

app.post("/api/candidates", async (req, res) => {
  const db = await getDb();
  const { id, name, party, symbol, constituency, description } = req.body;
  await db.run(
    "INSERT INTO candidates (id, name, party, symbol, constituency, description) VALUES (?, ?, ?, ?, ?, ?)",
    [id, name, party, symbol, constituency, description]
  );
  res.status(201).json({ message: "Candidate added" });
});

app.put("/api/candidates/:id", async (req, res) => {
  const db = await getDb();
  const { name, party, symbol, constituency, description } = req.body;
  await db.run(
    "UPDATE candidates SET name = ?, party = ?, symbol = ?, constituency = ?, description = ? WHERE id = ?",
    [name, party, symbol, constituency, description, req.params.id]
  );
  res.json({ message: "Candidate updated" });
});

app.delete("/api/candidates/:id", async (req, res) => {
  const db = await getDb();
  await db.run("DELETE FROM candidates WHERE id = ?", [req.params.id]);
  res.json({ message: "Candidate deleted" });
});

// --- VOTER REGISTRATION ---

app.post("/api/register/voter", async (req, res) => {
  const db = await getDb();
  const { name, epic, phone, constituency, pin } = req.body;
  try {
    const verification = await db.get("SELECT verified FROM otp_requests WHERE phoneNumber = ?", [phone]);
    if (!verification || !verification.verified) {
      return res.status(400).json({ error: "Phone number not verified. Please complete OTP verification first." });
    }

    await db.run(
      "INSERT INTO voters (epicNumber, phoneNumber, name, constituency, pin, status, phoneVerified, registeredAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [epic, phone, name, constituency, hashPin(pin), 'PENDING', 1, new Date().toISOString()]
    );
    
    await db.run("DELETE FROM otp_requests WHERE phoneNumber = ?", [phone]);
    
    const logId = Math.random().toString(36).slice(2, 11);
    await db.run(
      "INSERT INTO audit_logs (id, timestamp, action, details, severity) VALUES (?, ?, ?, ?, ?)",
      [logId, new Date().toISOString(), "VOTER_REGISTERED", `Voter ${name} registered with EPIC ${epic}`, "info"]
    );

    await sendSmsNotification(phone, `Namaste ${name}, your registration for BharatVote is successful. Please wait for admin approval.`);

    res.status(201).json({ message: "Voter registered successfully. Waiting for admin approval." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: "Registration failed. EPIC or Phone may already be registered." });
  }
});

// --- VOTER LOGIN ---

app.post("/api/login/voter", async (req, res) => {
  const db = await getDb();
  const { identifier, pin } = req.body;
  const hashedPin = hashPin(pin);
  const voter = await db.get(
    "SELECT epicNumber, phoneNumber, name, constituency, hasVoted, status FROM voters WHERE (epicNumber = ? OR phoneNumber = ?) AND pin = ?", 
    [identifier, identifier, hashedPin]
  );
  
  if (voter) {
    if (voter.status === 'DISABLED') {
      return res.status(403).json({ error: "Account disabled. Please contact admin." });
    }
    
    if (voter.status !== 'APPROVED') {
      return res.status(403).json({ error: "Account pending approval. Please wait for admin confirmation." });
    }
    
    // Check if it's a test/mock voter (EPIC starts with TEST or VOTE)
    const isTestVoter = voter.epicNumber.startsWith('TEST') || voter.epicNumber.startsWith('VOTE');
    if (isTestVoter) {
      return res.json({
        success: true,
        requiresOtp: false,
        epicNumber: voter.epicNumber,
        phoneNumber: voter.phoneNumber,
        name: voter.name,
        constituency: voter.constituency,
        hasVoted: voter.hasVoted,
        status: voter.status
      });
    }

    return res.json({
       success: true,
       requiresOtp: true,
       phoneNumber: voter.phoneNumber,
       maskedPhone: voter.phoneNumber.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2')
     });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/login/voter/complete", async (req, res) => {
  const db = await getDb();
  const { phoneNumber } = req.body;
  
  const verification = await db.get("SELECT verified FROM otp_requests WHERE phoneNumber = ?", [phoneNumber]);
  
  if (verification && verification.verified) {
    const voter = await db.get("SELECT epicNumber, phoneNumber, name, constituency, hasVoted, status FROM voters WHERE phoneNumber = ?", [phoneNumber]);
    if (voter) {
      await db.run("DELETE FROM otp_requests WHERE phoneNumber = ?", [phoneNumber]);
      res.json(voter);
    } else {
      res.status(404).json({ error: "Voter not found" });
    }
  } else {
    res.status(401).json({ error: "Phone verification required" });
  }
});

// --- ADMIN ROUTES ---

app.post("/api/register/admin", async (req, res) => {
  const db = await getDb();
  const { username, email, phone, pass, role } = req.body;
  try {
    const id = Math.random().toString(36).slice(2, 11);
    await db.run(
      "INSERT INTO admins (id, username, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)",
      [id, username, email, phone, pass, role]
    );
    res.status(201).json({ message: "Admin registered" });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(400).json({ error: "Admin registration failed" });
  }
});

app.post("/api/login/admin", async (req, res) => {
  const db = await getDb();
  const { username, password } = req.body;
  const admin = await db.get("SELECT id, username, role FROM admins WHERE username = ? AND password = ?", [username, password]);
  if (admin) {
    res.json(admin);
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// --- ELECTION ROUTES ---

app.get("/api/elections", async (_req, res) => {
  const db = await getDb();
  const elections = await db.all("SELECT * FROM elections");
  res.json(elections);
});

app.post("/api/elections", async (req, res) => {
  const db = await getDb();
  const { id, name, description, startAt, endAt } = req.body;
  await db.run(
    "INSERT INTO elections (id, name, description, startAt, endAt, isActive, resultsPublished) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, name, description, startAt, endAt, 1, 0]
  );
  res.status(201).json({ message: "Election created" });
});

app.put("/api/elections/:id", async (req, res) => {
  const db = await getDb();
  const { name, description, startAt, endAt, isActive, resultsPublished } = req.body;
  await db.run(
    "UPDATE elections SET name = ?, description = ?, startAt = ?, endAt = ?, isActive = ?, resultsPublished = ? WHERE id = ?",
    [name, description, startAt, endAt, isActive, resultsPublished, req.params.id]
  );
  res.json({ message: "Election updated" });
});

app.delete("/api/elections/:id", async (req, res) => {
  const db = await getDb();
  await db.run("DELETE FROM elections WHERE id = ?", [req.params.id]);
  res.json({ message: "Election deleted" });
});

// --- VOTER MANAGEMENT ---

app.get("/api/voters", async (_req, res) => {
  const db = await getDb();
  const voters = await db.all("SELECT epicNumber, phoneNumber, name, constituency, hasVoted, phoneVerified, status, registeredAt FROM voters");
  res.json(voters);
});

app.put("/api/voters/:epic/status", async (req, res) => {
  const db = await getDb();
  const { status } = req.body;
  await db.run("UPDATE voters SET status = ? WHERE epicNumber = ?", [status, req.params.epic]);
  res.json({ message: "Voter status updated" });
});

// --- VOTING ---

app.post("/api/vote", async (req, res) => {
  const db = await getDb();
  const { voterEpic, candidateId } = req.body;
  
  const voter = await db.get("SELECT hasVoted, constituency FROM voters WHERE epicNumber = ?", [voterEpic]);
  const candidate = await db.get("SELECT constituency FROM candidates WHERE id = ?", [candidateId]);

  if (!voter) return res.status(404).json({ error: "Voter not found" });
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });
  if (voter.hasVoted) return res.status(400).json({ error: "Voter has already cast their ballot" });

  if (voter.constituency !== candidate.constituency) {
    const logId = Math.random().toString(36).slice(2, 11);
    await db.run(
      "INSERT INTO audit_logs (id, timestamp, action, details, severity) VALUES (?, ?, ?, ?, ?)",
      [logId, new Date().toISOString(), "VOTE_FRAUD_ATTEMPT", `Voter ${voterEpic} attempted to vote for candidate ${candidateId} in a different constituency`, "critical"]
    );
    return res.status(403).json({ error: "You can only vote for candidates in your registered constituency" });
  }

  try {
    await db.run("UPDATE candidates SET votes = votes + 1 WHERE id = ?", [candidateId]);
    await db.run("UPDATE voters SET hasVoted = 1 WHERE epicNumber = ?", [voterEpic]);
    
    const logId = Math.random().toString(36).slice(2, 11);
    await db.run(
      "INSERT INTO audit_logs (id, timestamp, action, details, severity) VALUES (?, ?, ?, ?, ?)",
      [logId, new Date().toISOString(), "VOTE_CAST", `Vote successfully cast by ${voterEpic} for candidate ${candidateId}`, "info"]
    );
    
    const voterInfo = await db.get("SELECT phoneNumber FROM voters WHERE epicNumber = ?", [voterEpic]);
    if (voterInfo) {
      await sendSmsNotification(voterInfo.phoneNumber, "Your vote has been successfully cast and recorded on BharatVote. Thank you for participating in democracy!");
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Voting error:", error);
    res.status(500).json({ error: "Internal server error during voting process" });
  }
});

// --- LOGS ---

app.get("/api/logs", async (_req, res) => {
  const db = await getDb();
  const logs = await db.all("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50");
  res.json(logs);
});

// --- STATS ---

app.get("/api/stats", async (req, res) => {
  const db = await getDb();
  try {
    const isAdmin = req.query.admin === 'true';
    const election = await db.get("SELECT * FROM elections ORDER BY startAt DESC LIMIT 1");
    
    const votersCount = await db.get("SELECT COUNT(*) as count FROM voters");
    const votedCount = await db.get("SELECT COUNT(*) as count FROM voters WHERE hasVoted = 1");
    
    const constituencyStats = await db.all(`
      SELECT 
        constituency, 
        COUNT(*) as total,
        SUM(CASE WHEN hasVoted = 1 THEN 1 ELSE 0 END) as voted
      FROM voters
      GROUP BY constituency
    `);

    let results: any = {
      totalRegisteredVoters: votersCount.count,
      totalVotesCast: votedCount.count,
      constituencyStats,
      resultsPublished: election?.resultsPublished === 1,
      electionActive: election?.isActive === 1 && new Date(election.endAt) > new Date()
    };

    if (isAdmin || (election && election.resultsPublished === 1)) {
      const candidateVotes = await db.get("SELECT SUM(votes) as count FROM candidates");
      const candidates = await db.all("SELECT id, name, party, symbol, votes, constituency FROM candidates");
      return res.json({
        ...results,
        candidateVotesSum: candidateVotes.count || 0,
        candidates
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// --- AI ASSISTANT ---

app.post("/api/assistant", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Assistant message is required' });
    }

    const assistantResponse = await getElectionGuidance(message, Array.isArray(history) ? history : []);
    res.json({ answer: assistantResponse });
  } catch (error) {
    console.error('Assistant endpoint error:', error);
    res.status(500).json({ error: 'Failed to connect to the election assistant' });
  }
});

// ===== EXPORT FOR VERCEL =====

export default app;
