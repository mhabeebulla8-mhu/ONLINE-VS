import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { requestAadhaarOtp, verifyOtp, resendOtp } from "./services/aadhaarOtp.js";
import { getElectionGuidance } from "./services/gemini.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting server initialization...");
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  console.log("Assistant endpoint will be available at /api/assistant");

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Database initialization
  console.log("Initializing database...");
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });
  console.log("Database initialized.");

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
      aadhaarNumber TEXT NOT NULL,
      name TEXT NOT NULL,
      constituency TEXT NOT NULL,
      hasVoted BOOLEAN DEFAULT 0,
      pin TEXT NOT NULL,
      aadhaarVerified BOOLEAN DEFAULT 0,
      verificationToken TEXT,
      registeredAt TEXT
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
      role TEXT NOT NULL
    );
  `);

  // Seed initial admin if empty
  const adminCount = await db.get("SELECT COUNT(*) as count FROM admins");
  if (adminCount.count === 0) {
    await db.run(
      "INSERT INTO admins (id, username, password, role) VALUES (?, ?, ?, ?)",
      ['admin_1', 'admin', 'admin123', 'SYSTEM_ADMIN']
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

  // Seed test voter if empty
  const voterCount = await db.get("SELECT COUNT(*) as count FROM voters");
  if (voterCount.count === 0) {
    await db.run(
      "INSERT INTO voters (epicNumber, aadhaarNumber, name, constituency, pin) VALUES (?, ?, ?, ?, ?)",
      ['TEST123456', '123456789012', 'Test Voter', 'New Delhi', '1234']
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

  app.get("/api/voters", async (req, res) => {
    const voters = await db.all("SELECT epicNumber, name, constituency, hasVoted FROM voters");
    res.json(voters);
  });

  app.post("/api/register/voter", async (req, res) => {
    const { name, epic, aadhaar, constituency, pin } = req.body;
    try {
      await db.run(
        "INSERT INTO voters (epicNumber, aadhaarNumber, name, constituency, pin) VALUES (?, ?, ?, ?, ?)",
        [epic, aadhaar, name, constituency, pin]
      );
      res.status(201).json({ message: "Voter registered" });
    } catch (error) {
      res.status(400).json({ error: "Registration failed" });
    }
  });

  app.post("/api/register/admin", async (req, res) => {
    const { username, pass, role } = req.body;
    try {
      const id = Math.random().toString(36).substr(2, 9);
      await db.run(
        "INSERT INTO admins (id, username, password, role) VALUES (?, ?, ?, ?)",
        [id, username, pass, role]
      );
      res.status(201).json({ message: "Admin registered" });
    } catch (error) {
      res.status(400).json({ error: "Admin registration failed" });
    }
  });

  app.post("/api/login/voter", async (req, res) => {
    const { epic, pin } = req.body;
    const voter = await db.get("SELECT * FROM voters WHERE epicNumber = ? AND pin = ?", [epic, pin]);
    if (voter) {
      res.json(voter);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/login/voter-otp", async (req, res) => {
    const { aadhaar } = req.body;
    const voter = await db.get("SELECT * FROM voters WHERE aadhaarNumber = ?", [aadhaar]);
    if (voter) {
      res.json(voter);
    } else {
      res.status(401).json({ error: "Aadhaar not registered in system" });
    }
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
    const voter = await db.get("SELECT hasVoted FROM voters WHERE epicNumber = ?", [voterEpic]);
    if (voter && !voter.hasVoted) {
      await db.run("UPDATE candidates SET votes = votes + 1 WHERE id = ?", [candidateId]);
      await db.run("UPDATE voters SET hasVoted = 1 WHERE epicNumber = ?", [voterEpic]);
      
      const logId = Math.random().toString(36).substr(2, 9);
      await db.run(
        "INSERT INTO audit_logs (id, timestamp, action, details, severity) VALUES (?, ?, ?, ?, ?)",
        [logId, new Date().toISOString(), "VOTE_CAST", `Vote cast by ${voterEpic}`, "info"]
      );
      
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Already voted or invalid voter" });
    }
  });

  app.get("/api/logs", async (req, res) => {
    const logs = await db.all("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50");
    res.json(logs);
  });

  // ===== AADHAAR OTP VERIFICATION ENDPOINTS =====
  
  /**
   * POST /api/aadhaar/request-otp
   * Request OTP for Aadhaar verification
   * Body: { aadhaarNumber: string, purpose: 'registration' | 'login' }
   */
  app.post("/api/aadhaar/request-otp", async (req, res) => {
    try {
      const { aadhaarNumber, purpose } = req.body;

      if (!aadhaarNumber) {
        return res.status(400).json({
          success: false,
          error: 'Aadhaar number is required'
        });
      }

      const response = await requestAadhaarOtp({
        aadhaarNumber,
        purpose: purpose || 'voting'
      });

      if (response.success) {
        // Log the OTP request
        const logId = Math.random().toString(36).substr(2, 9);
        await db.run(
          "INSERT INTO audit_logs (id, timestamp, action, details, severity) VALUES (?, ?, ?, ?, ?)",
          [logId, new Date().toISOString(), "AADHAAR_OTP_REQUEST", `OTP requested for ${aadhaarNumber.slice(-4)}****`, "info"]
        );
      }

      res.json(response);
    } catch (error) {
      console.error('Error requesting OTP:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to request OTP'
      });
    }
  });

  /**
   * POST /api/aadhaar/verify-otp
   * Verify OTP and authenticate user
   * Body: { transactionId: string, otp: string, aadhaarNumber: string }
   */
  app.post("/api/aadhaar/verify-otp", async (req, res) => {
    try {
      const { transactionId, otp, aadhaarNumber } = req.body;

      if (!transactionId || !otp || !aadhaarNumber) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const response = await verifyOtp({
        transactionId,
        otp,
        aadhaarNumber
      });

      if (response.success) {
        // Log successful verification
        const logId = Math.random().toString(36).substr(2, 9);
        await db.run(
          "INSERT INTO audit_logs (id, timestamp, action, details, severity) VALUES (?, ?, ?, ?, ?)",
          [logId, new Date().toISOString(), "AADHAAR_OTP_VERIFIED", `OTP verified for ${aadhaarNumber.slice(-4)}****`, "info"]
        );
      } else {
        // Log failed verification
        const logId = Math.random().toString(36).substr(2, 9);
        await db.run(
          "INSERT INTO audit_logs (id, timestamp, action, details, severity) VALUES (?, ?, ?, ?, ?)",
          [logId, new Date().toISOString(), "AADHAAR_OTP_FAILED", `OTP verification failed - ${response.error}`, "warning"]
        );
      }

      res.json(response);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify OTP'
      });
    }
  });

  /**
   * POST /api/aadhaar/resend-otp
   * Resend OTP for a transaction
   * Body: { transactionId: string }
   */
  app.post("/api/aadhaar/resend-otp", async (req, res) => {
    try {
      const { transactionId } = req.body;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: 'Transaction ID is required'
        });
      }

      const response = await resendOtp(transactionId);

      if (response.success) {
        const logId = Math.random().toString(36).substr(2, 9);
        await db.run(
          "INSERT INTO audit_logs (id, timestamp, action, details, severity) VALUES (?, ?, ?, ?, ?)",
          [logId, new Date().toISOString(), "AADHAAR_OTP_RESENT", `OTP resent for transaction ${transactionId}`, "info"]
        );
      }

      res.json(response);
    } catch (error) {
      console.error('Error resending OTP:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend OTP'
      });
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
