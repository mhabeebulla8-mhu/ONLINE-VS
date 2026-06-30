import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { getElectionGuidance } from "./services/gemini.js";
import { notifyRegistrationSuccess, notifyVoteCast } from "./services/notificationService.js";
import crypto from "crypto";
import { rateLimit } from 'express-rate-limit';
import axios from "axios";

// Rate limiter for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 OTP requests per window
  message: { error: "Too many OTP requests. Please try again after 15 minutes." },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Rate limiter for OTP verification (brute force protection)
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 verification attempts per window
  message: { error: "Too many verification attempts. Please try again after 15 minutes." },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Simple PIN hashing helper
const hashPin = (pin: string) => {
  return crypto.createHash('sha256').update(pin).digest('hex');
};

// OTP Hashing helper
const hashOtp = (otp: string) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Fast2SMS Integration
async function sendFast2SMS(phoneNumber: string, otp: string) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  // Clean phone number (remove +91 if present)
  const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/\s+/g, '');

  if (!apiKey || apiKey === 'your_fast2sms_api_key') {
    console.warn('--- FAST2SMS_API_KEY NOT CONFIGURED ---');
    console.warn(`[INFO] SMS delivery is MOCKED for ${cleanPhone}. Please configure FAST2SMS_API_KEY for real delivery.`);
    console.warn('---------------------------------------');
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting server initialization...");
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;

  app.use(express.json());

  console.log("Assistant endpoint will be available at /api/assistant");

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- SECURE OTP ROUTES ---

  app.post("/api/auth/send-otp", otpLimiter, async (req, res) => {
    const { phoneNumber, name, epicNumber } = req.body;
    
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber.replace(/^\+91/, ''))) {
      return res.status(400).json({ error: "Invalid Indian phone number. Please enter 10 digits." });
    }

    // If EPIC number is provided, check if it's already registered
    if (epicNumber) {
      const existingVoter = await db.get("SELECT epicNumber FROM voters WHERE epicNumber = ?", [epicNumber]);
      if (existingVoter) {
        return res.status(400).json({ error: "EPIC Number is already registered. Please login instead." });
      }
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    try {
      // Store or update OTP request
      await db.run(
        `INSERT OR REPLACE INTO otp_requests (phoneNumber, otpHash, expiry, attempts, verified) 
         VALUES (?, ?, ?, 0, 0)`,
        [phoneNumber, otpHash, expiry]
      );

      // Send via Fast2SMS
      await sendFast2SMS(phoneNumber, otp);

      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error: any) {
      console.error("OTP Send Error:", error.message);
      res.status(500).json({ error: error.message || "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", verifyLimiter, async (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: "Phone number and OTP are required" });
    }

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

      // Mark as verified
      await db.run("UPDATE otp_requests SET verified = 1 WHERE phoneNumber = ?", [phoneNumber]);

      res.json({ success: true, message: "Phone verified successfully" });
    } catch (error) {
      console.error("OTP Verify Error:", error);
      res.status(500).json({ error: "Internal server error during verification" });
    }
  });

  // Database initialization
  console.log("Initializing database...");
  const dbPath = process.env.DATABASE_PATH || "./database.sqlite";
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  console.log(`Database initialized at: ${dbPath}`);

  // Check and migrate voters table if necessary
  const tableInfo = await db.all("PRAGMA table_info(voters)");
  const columnNames = tableInfo.map(c => c.name);

  if (columnNames.length > 0) {
    // If aadhaarNumber exists but phoneNumber doesn't, rename it
    if (columnNames.includes('aadhaarNumber') && !columnNames.includes('phoneNumber')) {
      console.log("Migrating aadhaarNumber to phoneNumber...");
      await db.exec("ALTER TABLE voters RENAME COLUMN aadhaarNumber TO phoneNumber");
    }
    
    // Add missing columns
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
  const adminColumnNames = adminTableInfo.map(c => c.name);
  if (adminColumnNames.length > 0) {
    if (!adminColumnNames.includes('email')) {
      await db.exec("ALTER TABLE admins ADD COLUMN email TEXT");
    }
    if (!adminColumnNames.includes('phone')) {
      await db.exec("ALTER TABLE admins ADD COLUMN phone TEXT");
    }
  }

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

  // Seed initial admin if empty
  const adminCount = await db.get("SELECT COUNT(*) as count FROM admins");
  if (adminCount.count === 0) {
    await db.run(
      "INSERT INTO admins (id, username, password, role) VALUES (?, ?, ?, ?)",
      ['admin_01', 'official_admin', 'Pass123!@#', 'SYSTEM_ADMIN']
    );
  }

  // Seed initial candidates if empty
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

  // Seed test voters if empty (EPIC starting with TEST/VOTE bypasses OTP)
  const voterCount = await db.get("SELECT COUNT(*) as count FROM voters");
  if (voterCount.count === 0) {
    const testVoters = [
      { epic: 'VOTE123456', phone: '9876543210', name: 'Sample Voter', constituency: 'New Delhi', pin: '4321' },
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

  // Seed default election if empty
  const electionCount = await db.get("SELECT COUNT(*) as count FROM elections");
  if (electionCount.count === 0) {
    await db.run(
      "INSERT INTO elections (id, name, description, startAt, endAt, isActive) VALUES (?, ?, ?, ?, ?, ?)",
      ['election_1', 'General Election 2026', 'National level voting for parliamentary seats.', new Date().toISOString(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 1]
    );
  }

  // API Routes
  app.get("/api/candidates", async (req, res) => {
    const candidates = await db.all("SELECT * FROM candidates");
    res.json(candidates);
  });

  app.post("/api/candidates", async (req, res) => {
    const { id, name, party, symbol, constituency, description } = req.body;
    await db.run(
      "INSERT INTO candidates (id, name, party, symbol, constituency, description) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, party, symbol, constituency, description]
    );
    res.status(201).json({ message: "Candidate added" });
  });

  app.delete("/api/candidates/:id", async (req, res) => {
    await db.run("DELETE FROM candidates WHERE id = ?", [req.params.id]);
    res.json({ message: "Candidate deleted" });
  });

  app.post("/api/register/voter", async (req, res) => {
    const { name, epic, phone, constituency, pin } = req.body;
    try {
      // Verify OTP was actually completed for this phone number
      const verification = await db.get("SELECT verified FROM otp_requests WHERE phoneNumber = ?", [phone]);
      if (!verification || !verification.verified) {
        return res.status(400).json({ error: "Phone number not verified. Please complete OTP verification first." });
      }

      await db.run(
        "INSERT INTO voters (epicNumber, phoneNumber, name, constituency, pin, status, phoneVerified, registeredAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [epic, phone, name, constituency, hashPin(pin), 'PENDING', 1, new Date().toISOString()]
      );
      
      // Clear verification record after successful registration
      await db.run("DELETE FROM otp_requests WHERE phoneNumber = ?", [phone]);
      
      const logId = Math.random().toString(36).slice(2, 11);
      await db.run(
        "INSERT INTO audit_logs (id, timestamp, action, details, severity) VALUES (?, ?, ?, ?, ?)",
        [logId, new Date().toISOString(), "VOTER_REGISTERED", `Voter ${name} registered with EPIC ${epic}`, "info"]
      );

      // Notify voter
      await notifyRegistrationSuccess(phone, name);

      res.status(201).json({ message: "Voter registered successfully. Waiting for admin approval." });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Registration failed. EPIC or Phone may already be registered." });
    }
  });

  app.post("/api/login/voter", otpLimiter, async (req, res) => {
    const { identifier, pin } = req.body; // identifier can be EPIC or Phone
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

      // Return success and let frontend trigger OTP verification
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

  app.post("/api/login/voter/complete", verifyLimiter, async (req, res) => {
    const { phoneNumber } = req.body;
    
    // Check if the phone was verified via our custom OTP system
    const verification = await db.get("SELECT verified FROM otp_requests WHERE phoneNumber = ?", [phoneNumber]);
    
    if (verification && verification.verified) {
      const voter = await db.get("SELECT epicNumber, phoneNumber, name, constituency, hasVoted, status FROM voters WHERE phoneNumber = ?", [phoneNumber]);
      if (voter) {
        // Clear verification record after successful login
        await db.run("DELETE FROM otp_requests WHERE phoneNumber = ?", [phoneNumber]);
        res.json(voter);
      } else {
        res.status(404).json({ error: "Voter not found" });
      }
    } else {
      res.status(401).json({ error: "Phone verification required" });
    }
  });

  app.post("/api/register/admin", async (req, res) => {
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

  // ===== ELECTION MANAGEMENT =====

  app.get("/api/elections", async (req, res) => {
    const elections = await db.all("SELECT * FROM elections");
    res.json(elections);
  });

  app.post("/api/elections", async (req, res) => {
    const { id, name, description, startAt, endAt } = req.body;
    await db.run(
      "INSERT INTO elections (id, name, description, startAt, endAt, isActive, resultsPublished) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, name, description, startAt, endAt, 1, 0]
    );
    res.status(201).json({ message: "Election created" });
  });

  app.put("/api/elections/:id", async (req, res) => {
    const { name, description, startAt, endAt, isActive, resultsPublished } = req.body;
    await db.run(
      "UPDATE elections SET name = ?, description = ?, startAt = ?, endAt = ?, isActive = ?, resultsPublished = ? WHERE id = ?",
      [name, description, startAt, endAt, isActive, resultsPublished, req.params.id]
    );
    res.json({ message: "Election updated" });
  });

  app.delete("/api/elections/:id", async (req, res) => {
    await db.run("DELETE FROM elections WHERE id = ?", [req.params.id]);
    res.json({ message: "Election deleted" });
  });

  // ===== CANDIDATE MANAGEMENT (Enhanced) =====

  app.put("/api/candidates/:id", async (req, res) => {
    const { name, party, symbol, constituency, description } = req.body;
    await db.run(
      "UPDATE candidates SET name = ?, party = ?, symbol = ?, constituency = ?, description = ? WHERE id = ?",
      [name, party, symbol, constituency, description, req.params.id]
    );
    res.json({ message: "Candidate updated" });
  });

  // ===== VOTER MANAGEMENT =====

  app.get("/api/voters", async (req, res) => {
    const voters = await db.all("SELECT epicNumber, phoneNumber, name, constituency, hasVoted, phoneVerified, status, registeredAt FROM voters");
    res.json(voters);
  });

  app.put("/api/voters/:epic/status", async (req, res) => {
    const { status } = req.body;
    await db.run("UPDATE voters SET status = ? WHERE epicNumber = ?", [status, req.params.epic]);
    res.json({ message: "Voter status updated" });
  });

  app.post("/api/login/admin", async (req, res) => {
    const { username, password } = req.body;
    const admin = await db.get("SELECT id, username, role FROM admins WHERE username = ? AND password = ?", [username, password]);
    if (admin) {
      res.json(admin);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/vote", async (req, res) => {
    const { voterEpic, candidateId } = req.body;
    
    // Fetch voter and candidate details to verify constituency match
    const voter = await db.get("SELECT hasVoted, constituency FROM voters WHERE epicNumber = ?", [voterEpic]);
    const candidate = await db.get("SELECT constituency FROM candidates WHERE id = ?", [candidateId]);

    if (!voter) {
      return res.status(404).json({ error: "Voter not found" });
    }

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    if (voter.hasVoted) {
      return res.status(400).json({ error: "Voter has already cast their ballot" });
    }

    if (voter.constituency !== candidate.constituency) {
      const logId = Math.random().toString(36).slice(2, 11);
      await db.run(
        "INSERT INTO audit_logs (id, timestamp, action, details, severity) VALUES (?, ?, ?, ?, ?)",
        [logId, new Date().toISOString(), "VOTE_FRAUD_ATTEMPT", `Voter ${voterEpic} attempted to vote for candidate ${candidateId} in a different constituency (${candidate.constituency} vs ${voter.constituency})`, "critical"]
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
      
      // Notify voter
      const voterInfo = await db.get("SELECT phoneNumber FROM voters WHERE epicNumber = ?", [voterEpic]);
      if (voterInfo) {
        await notifyVoteCast(voterInfo.phoneNumber);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Voting error:", error);
      res.status(500).json({ error: "Internal server error during voting process" });
    }
  });

  app.get("/api/logs", async (req, res) => {
    const logs = await db.all("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50");
    res.json(logs);
  });

  app.get("/api/stats", async (req, res) => {
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

      let results = {
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    // Disable Vite HMR websocket server to avoid port conflicts in shared environments
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware initialized (HMR disabled).");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
