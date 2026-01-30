const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('CRITICAL ERROR: MONGODB_URI environment variable is not set.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Vote Fraud Prevention - In-memory cache for IP-based throttling
const voteCache = new Map();
const VOTE_COOLDOWN_HOURS = 24;

/**
 * Check if IP has already voted recently
 */
function hasIPVotedRecently(ip) {
  if (!voteCache.has(ip)) return false;

  const lastVoteTime = voteCache.get(ip);
  const timeSinceLastVote = Date.now() - lastVoteTime;
  const cooldownMs = VOTE_COOLDOWN_HOURS * 60 * 60 * 1000;

  return timeSinceLastVote < cooldownMs;
}

/**
 * Record vote for IP
 */
function recordVote(ip) {
  voteCache.set(ip, Date.now());
}

/**
 * Get client IP from request
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.socket.remoteAddress ||
         'unknown';
}

// Enhanced Connection Logic
const connectWithRetry = () => {
  console.log('Attempting MongoDB connection...');
  mongoose
    .connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    })
    .then(() => {
      console.log('✅ Connected to MongoDB');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('Retrying in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

if (MONGODB_URI) {
  connectWithRetry();
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err.message);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: state === 1 ? 'ok' : 'db_unavailable',
    mongoState: state,
    mongoStatus: states[state] || 'unknown',
    uriSet: !!MONGODB_URI,
    timestamp: new Date().toISOString()
  });
});

// Enhanced Survey Schema with vote fraud prevention
const surveySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  questions: [
    {
      question: { type: String, required: true, trim: true },
      type: { type: String, enum: ['text', 'multiple', 'yesno'], required: true },
      options: [{ type: String }],
    },
  ],
  responses: [
    {
      answers: [{ type: String }],
      submittedAt: { type: Date, default: Date.now },
      ipHash: { type: String, default: null }, // Hashed IP for fraud prevention
      sessionToken: { type: String, default: null },
      userAgent: { type: String, default: null },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Survey = mongoose.model('Survey', surveySchema);

/**
 * Hash IP for privacy
 */
function hashIP(ip) {
  return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'default').digest('hex');
}

/**
 * Middleware to ensure DB is connected
 */
function ensureDbConnected(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'מסד הנתונים אינו זמין כרגע.',
      db_state: mongoose.connection.readyState
    });
  }
  next();
}

/**
 * GET /api/surveys - List all surveys
 */
app.get('/api/surveys', ensureDbConnected, async (req, res) => {
  try {
    const surveys = await Survey.find().select('-responses');
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/surveys/:id - Get single survey
 */
app.get('/api/surveys/:id', ensureDbConnected, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).select('-responses');
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(400).json({ error: 'Invalid survey id: ' + err.message });
  }
});

/**
 * POST /api/surveys/:id/responses - Submit response with fraud prevention
 */
app.post('/api/surveys/:id/responses', ensureDbConnected, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: 'Survey not found' });

    // Fraud Prevention - Check IP
    const clientIP = getClientIP(req);
    const ipHash = hashIP(clientIP);

    // Check if this IP has voted recently
    if (hasIPVotedRecently(clientIP)) {
      return res.status(429).json({
        error: 'בן אדם זה כבר הצביע בתוך 24 השעות האחרונות',
        retryAfter: VOTE_COOLDOWN_HOURS * 3600
      });
    }

    // Validate answers
    const { answers, metadata } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers must be an array' });
    }

    // For gallery-based voting, allow single answer
    const minAnswers = survey.questions.length === 1 ? 1 : survey.questions.length;
    if (answers.length < minAnswers) {
      return res.status(400).json({
        error: `Expected at least ${minAnswers} answer(s), got ${answers.length}`
      });
    }

    // Prepare response with metadata
    const responseData = {
      answers,
      ipHash,
      sessionToken: metadata?.sessionToken || null,
      userAgent: metadata?.userAgent?.substring(0, 255) || null, // Truncate for DB
    };

    survey.responses.push(responseData);
    await survey.save();

    // Record vote for this IP
    recordVote(clientIP);

    console.log(`✅ Vote recorded from IP: ${clientIP.substring(0, 10)}... (hashed)`);

    res.status(200).json({
      message: 'Response submitted successfully',
      votesTotal: survey.responses.length
    });

  } catch (err) {
    console.error('Error submitting response:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/surveys/:id/results - Get aggregated results
 */
app.get('/api/surveys/:id/results', ensureDbConnected, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: 'Survey not found' });

    const totalResponses = survey.responses.length;
    const results = survey.questions.map((q, qIndex) => {
      const stats = {
        question: q.question,
        type: q.type,
        total: totalResponses,
        data: {}
      };

      if (q.type === 'multiple' || q.type === 'yesno') {
        const counts = {};
        const options = q.type === 'yesno' ? ['כן', 'לא'] : q.options;

        // Initialize counts
        options.forEach(opt => counts[opt] = 0);

        // Count responses
        survey.responses.forEach(resp => {
          const answer = resp.answers[qIndex];
          if (answer && counts.hasOwnProperty(answer)) {
            counts[answer]++;
          }
        });

        stats.data = counts;
      } else if (q.type === 'text') {
        stats.data = survey.responses
          .map(resp => resp.answers[qIndex])
          .filter(Boolean);
      }

      return stats;
    });

    res.json({
      title: survey.title,
      totalResponses,
      results,
      lastUpdated: new Date().toISOString()
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/surveys - Create new survey (Admin only in production)
 */
app.post('/api/surveys', ensureDbConnected, async (req, res) => {
  try {
    // In production, add authentication middleware here
    const { title, description, questions } = req.body;

    if (!title || !questions) {
      return res.status(400).json({ error: 'Title and questions are required' });
    }

    const survey = new Survey({
      title,
      description,
      questions
    });

    await survey.save();
    res.status(201).json(survey);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend from project root
app.use(express.static(require('path').join(__dirname, '..')));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  MongoDB URI status: ${MONGODB_URI ? 'Configured' : 'NOT SET'}`);
  console.log(`🛡️  Vote fraud prevention: Active (${VOTE_COOLDOWN_HOURS}h cooldown)`);
  console.log(`📦 API Base: http://localhost:${PORT}/api`);
});
