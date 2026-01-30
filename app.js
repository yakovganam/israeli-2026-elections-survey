/**
 * Survey Website - 2026 Israeli Elections
 * Enhanced with vote fraud prevention and improved UX
 */

const API_BASE = 'https://survey-website-backend.onrender.com/api';
const ELECTION_SURVEY_ID = 1;

// Vote Fraud Prevention - Session tracking
const SESSION_STORAGE_KEY = 'survey_session_token';
const VOTE_TIMESTAMP_KEY = 'survey_vote_timestamp';

const politicalParties = [
  { id: 'likud', name: 'הליכוד' },
  { id: 'yesh-atid', name: 'יש עתיד' },
  { id: 'state-camp', name: 'המחנה הממלכתי' },
  { id: 'shas', name: 'ש"ס' },
  { id: 'united-torah-judaism', name: 'יהדות התורה' },
  { id: 'religious-zionism', name: 'הציונות הדתית' },
  { id: 'otzma-yehudit', name: 'עוצמה יהודית' },
  { id: 'yisrael-beytenu', name: 'ישראל ביתנו' },
  { id: 'labor', name: 'העבודה' },
  { id: 'meretz', name: 'מרצ' },
  { id: 'raam', name: 'רע"ם' },
  { id: 'hadash-taal', name: 'חד"ש-תע"ל' },
  { id: 'balad', name: 'בל"ד' },
  { id: 'no-vote', name: 'לא מצביע/ה' },
  { id: 'other', name: 'אחר' },
];

// State management
let currentSurvey = null;
let selectedParty = null;

// DOM Elements
const startBtn = document.getElementById('start-survey-btn');
const surveySection = document.getElementById('survey-section');
const surveyForm = document.getElementById('survey-form');
const backBtn = document.getElementById('back-btn');

/**
 * Initialize session token for fraud prevention
 */
function initializeSession() {
  if (!sessionStorage.getItem(SESSION_STORAGE_KEY)) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, generateSessionToken());
  }
}

/**
 * Generate unique session token
 */
function generateSessionToken() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Check if user has already voted (fraud prevention)
 */
function hasAlreadyVoted() {
  const lastVoteTime = localStorage.getItem(VOTE_TIMESTAMP_KEY);
  if (!lastVoteTime) return false;

  const timeSinceLastVote = Date.now() - parseInt(lastVoteTime);
  const VOTE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

  return timeSinceLastVote < VOTE_COOLDOWN;
}

/**
 * Get client IP via API (for logging purposes)
 */
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (err) {
    console.warn('Could not fetch IP:', err);
    return 'unknown';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeSession();

  if (startBtn) {
    startBtn.addEventListener('click', loadElectionSurvey);
  }
  if (backBtn) {
    backBtn.addEventListener('click', returnToHome);
  }
});

/**
 * Load the election survey (id=1)
 */
async function loadElectionSurvey() {
  showLoading('טוען סקר...');

  try {
    const response = await fetch(`${API_BASE}/surveys/${ELECTION_SURVEY_ID}`);

    if (!response.ok) {
      throw new Error('Failed to load survey');
    }

    const survey = await response.json();
    currentSurvey = survey;

    displaySurvey(survey);
  } catch (error) {
    console.error('Error loading survey:', error);
    showError('שגיאה בטעינת הסקר. אנא נסה שוב מאוחר יותר.');
  }
}

/**
 * Display survey form with enhanced party gallery
 */
function displaySurvey(survey) {
  // Hide other sections
  document.querySelector('.hero-header').style.display = 'none';
  document.querySelector('.info-section').style.display = 'none';
  document.querySelector('.features-section').style.display = 'none';
  surveySection.style.display = 'block';

  let formHTML = `
    <h3 style="margin-bottom: 24px; color: var(--gray-900); font-size: 1.5rem;">
      ${survey.title}
    </h3>
    <p style="margin-bottom: 32px; color: var(--gray-600); font-size: 1.05rem;">
      ${survey.description || ''}
    </p>
    <form id="election-form">
  `;

  // Process questions
  const questions = survey.questions || [];

  // Find the political party vote question
  const politicalVoteQuestion = questions.find(q =>
    q.question.includes('למי היית מצביע') || q.question.includes('בחירות')
  );

  if (politicalVoteQuestion) {
    formHTML += renderPartyGallery(politicalParties, politicalVoteQuestion.id);
  } else {
    // Render other questions if the political vote question is not found
    questions.forEach((q, index) => {
      const question = ensureArrayOptions(q);
      formHTML += renderQuestion(question, index);
    });
  }

  formHTML += `
      <button type="submit" style="margin-top: 32px; display: none;">
        שלח תשובות
      </button>
    </form>
  `;

  surveyForm.innerHTML = formHTML;

  // Attach submit handler (only if there are other questions)
  if (!politicalVoteQuestion) {
    const form = document.getElementById('election-form');
    form.addEventListener('submit', handleSubmit);
  }

  // Smooth scroll to survey
  surveySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Render individual question
 */
function renderQuestion(question, index) {
  const inputId = `q${index}`;
  let html = `
    <div class="question" style="margin-bottom: 24px;">
      <label for="${inputId}" style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--gray-900);">
        ${question.question}
      </label>
  `;

  if (question.type === 'text') {
    html += `
      <input
        type="text"
        id="${inputId}"
        name="answer${index}"
        placeholder="הקלד/י תשובה כאן..."
        required
        aria-required="true"
        style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 1rem;"
      />
    `;
  } else if (question.type === 'multiple') {
    html += `
      <select
        id="${inputId}"
        name="answer${index}"
        required
        aria-required="true"
        style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 1rem;"
      >
        <option value="" disabled selected>בחר/י מפלגה...</option>
    `;
    (question.options || []).forEach(option => {
      html += `<option value="${option}">${option}</option>`;
    });
    html += `</select>`;
  } else if (question.type === 'yesno') {
    html += `
      <select
        id="${inputId}"
        name="answer${index}"
        required
        aria-required="true"
        style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 1rem;"
      >
        <option value="" disabled selected>בחר/י...</option>
        <option value="כן">כן</option>
        <option value="לא">לא</option>
      </select>
    `;
  }

  html += `</div>`;
  return html;
}

/**
 * Render enhanced party gallery for voting
 */
function renderPartyGallery(parties, questionId) {
  let galleryHTML = `
    <div class="question-text">למי היית מצביע/ה אם הבחירות היו מתקיימות היום?</div>
    <div class="party-gallery">
  `;

  parties.forEach(party => {
    galleryHTML += `
      <div class="party-card" data-party-id="${party.id}" data-question-id="${questionId}" tabindex="0" role="button" aria-label="בחר ${party.name}">
        <span class="party-name">${party.name}</span>
      </div>
    `;
  });

  galleryHTML += `</div>`;

  return galleryHTML;
}

/**
 * Handle party selection and submission
 */
async function handlePartyVote(partyId, questionId) {
  // Fraud prevention check
  if (hasAlreadyVoted()) {
    showError('⚠️ כבר הצבעת בתוך 24 השעות האחרונות. ניתן להצביע שוב מחר.');
    return;
  }

  selectedParty = partyId;

  // Visual feedback
  document.querySelectorAll('.party-card').forEach(card => {
    card.classList.remove('selected');
  });
  event.currentTarget.classList.add('selected');

  showLoading('שולח הצבעה...');

  try {
    const clientIP = await getClientIP();

    const response = await fetch(`${API_BASE}/surveys/${ELECTION_SURVEY_ID}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: [
          { questionId: questionId, answer: partyId }
        ],
        metadata: {
          sessionToken: sessionStorage.getItem(SESSION_STORAGE_KEY),
          clientIP: clientIP,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Submission failed');
    }

    // Mark vote in localStorage
    localStorage.setItem(VOTE_TIMESTAMP_KEY, Date.now().toString());

    // Success!
    showSuccessMessage();

    // Redirect to results after 2 seconds
    setTimeout(() => {
      window.location.href = `results.html?id=${ELECTION_SURVEY_ID}`;
    }, 2000);

  } catch (error) {
    console.error('Error submitting party vote:', error);
    showError('שגיאה בשליחת ההצבעה. אנא נסה שוב.');
  }
}

/**
 * Handle form submission
 */
async function handleSubmit(e) {
  e.preventDefault();

  if (hasAlreadyVoted()) {
    showError('⚠️ כבר הצבעת בתוך 24 השעות האחרונות. ניתן להצביע שוב מחר.');
    return;
  }

  const form = e.target;
  const formData = new FormData(form);
  const answers = [];

  let i = 0;
  while (form.querySelector(`[name="answer${i}"]`)) {
    answers.push(formData.get(`answer${i}`));
    i++;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'שולח...';
  submitBtn.disabled = true;

  try {
    const clientIP = await getClientIP();

    const response = await fetch(`${API_BASE}/surveys/${ELECTION_SURVEY_ID}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers,
        metadata: {
          sessionToken: sessionStorage.getItem(SESSION_STORAGE_KEY),
          clientIP: clientIP,
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Submission failed');
    }

    localStorage.setItem(VOTE_TIMESTAMP_KEY, Date.now().toString());

    showSuccessMessage();

    setTimeout(() => {
      window.location.href = `results.html?id=${ELECTION_SURVEY_ID}`;
    }, 2000);

  } catch (error) {
    console.error('Error submitting response:', error);
    alert('שגיאה בשליחת התשובות. אנא נסה שוב.');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

/**
 * Return to home view
 */
function returnToHome() {
  document.querySelector('.hero-header').style.display = 'block';
  document.querySelector('.info-section').style.display = 'block';
  document.querySelector('.features-section').style.display = 'block';
  surveySection.style.display = 'none';
  selectedParty = null;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Show loading state
 */
function showLoading(message = 'טוען...') {
  surveyForm.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Show error message
 */
function showError(message) {
  surveyForm.innerHTML = `
    <div class="error-message">
      <h3>⚠️ שגיאה</h3>
      <p>${message}</p>
      <button onclick="returnToHome()" class="btn-tertiary" style="margin-top: 20px;">
        חזרה לדף הבית
      </button>
    </div>
  `;
}

/**
 * Show success message
 */
function showSuccessMessage() {
  surveyForm.innerHTML = `
    <div class="success-message">
      <h3>✓ הסקר נשלח בהצלחה!</h3>
      <p style="margin-bottom: 12px;">תשובותיך נקלטו בהצלחה במערכת</p>
      <p style="opacity: 0.9; font-size: 0.95rem;">מעביר אותך לעמוד התוצאות...</p>
    </div>
  `;
}

/**
 * Ensure options is an array
 */
function ensureArrayOptions(question) {
  if (question && question.type === 'multiple') {
    if (typeof question.options === 'string') {
      try {
        question.options = JSON.parse(question.options);
      } catch (_) {
        question.options = [];
      }
    }
    if (!Array.isArray(question.options)) {
      question.options = [];
    }
  }
  return question;
}

// Make returnToHome available globally
window.returnToHome = returnToHome;

/**
 * Attach event listeners for party cards
 */
document.addEventListener('click', (event) => {
  const partyCard = event.target.closest('.party-card');
  if (partyCard) {
    const partyId = partyCard.dataset.partyId;
    const questionId = partyCard.dataset.questionId;
    if (partyId && questionId) {
      handlePartyVote(partyId, questionId);
    }
  }
});

/**
 * Keyboard navigation for party cards
 */
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    const focused = document.activeElement;
    if (focused && focused.classList.contains('party-card')) {
      event.preventDefault();
      focused.click();
    }
  }
});
