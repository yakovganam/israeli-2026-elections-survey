const API_BASE = 'https://survey-website-backend.onrender.com/api';
const ELECTION_SURVEY_ID = 1;

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

// DOM Elements
const startBtn = document.getElementById('start-survey-btn');
const surveySection = document.getElementById('survey-section');
const surveyForm = document.getElementById('survey-form');
const backBtn = document.getElementById('back-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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
  showLoading();
  
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
 * Display survey form
 */
function displaySurvey(survey) {
  // Hide hero section, show survey section
  document.querySelector('.hero-header').style.display = 'none';
  document.querySelector('.info-section').style.display = 'none';
  document.querySelector('.features-section').style.display = 'none';
  surveySection.style.display = 'block';
  
  // Build form HTML
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
  
  // Assuming the first question is the political party vote
  const politicalVoteQuestion = questions.find(q => q.question === 'למי היית מצביע עם הבחירות היום מתקיימות היום?');

  if (politicalVoteQuestion) {
    formHTML += renderPartyGallery(politicalParties, politicalVoteQuestion.id); // Pass question ID to associate vote
  } else {
    // Render other questions if the political vote question is not found
    questions.forEach((q, index) => {
      const question = ensureArrayOptions(q);
      formHTML += renderQuestion(question, index);
    });
  }

  formHTML += `
      <button type="submit" style="margin-top: 32px;" ${politicalVoteQuestion ? 'style="display: none;"' : ''}>
        שלח תשובות
      </button>
    </form>
  `;
  
  surveyForm.innerHTML = formHTML;
  
  // Attach submit handler (only if there are other questions requiring a form submit)
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
    <div class="question">
      <label for="${inputId}">${question.question}</label>
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
      />
    `;
  } else if (question.type === 'multiple') {
    html += `
      <select 
        id="${inputId}" 
        name="answer${index}"
        required
        aria-required="true"
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
 * Render party gallery for voting
 */
function renderPartyGallery(parties, questionId) {
  let galleryHTML = `
    <div class="question-text">למי היית מצביע/ה עם הבחירות היום מתקיימות היום?</div>
    <div class="party-gallery">
  `;
  
  parties.forEach(party => {
    galleryHTML += `
      <div class="party-card" data-party-id="${party.id}" data-question-id="${questionId}">
        <span class="party-name">${party.name}</span>
      </div>
    `;
  });
  
  galleryHTML += `</div>`;
  
  // Attach event listeners after HTML is rendered
  // (This will be handled once the surveyForm.innerHTML is set)
  return galleryHTML;
}

/**
 * Handle a single party vote submission
 */
async function handlePartyVote(partyId, questionId) {
  showLoading(); // Show loading while submitting
  
  try {
    const response = await fetch(`${API_BASE}/surveys/${ELECTION_SURVEY_ID}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        answers: [
          { questionId: questionId, answer: partyId } // Format for single question
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Submission failed');
    }
    
    // Success!
    showSuccessMessage();
    
    // Redirect to results after 2 seconds
    setTimeout(() => {
      window.location.href = `results.html?id=${ELECTION_SURVEY_ID}`;
    }, 2000);
    
  } catch (error) {
    console.error('Error submitting party vote:', error);
    alert('שגיאה בשליחת ההצבעה. אנא נסה שוב.');
    showError('שגיאה בשליחת ההצבעה. אנא נסה שוב.'); // Show error on screen
  }
}

/**
 * Handle form submission (for other questions, if any)
 */
async function handleSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const answers = [];
  
  // Collect all answers
  let i = 0;
  while (form.querySelector(`[name="answer${i}"]`)) {
    answers.push(formData.get(`answer${i}`));
    i++;
  }
  
  // Show loading state on button
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'שולח...';
  submitBtn.disabled = true;
  
  try {
    const response = await fetch(`${API_BASE}/surveys/${ELECTION_SURVEY_ID}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Submission failed');
    }
    
    // Success!
    showSuccessMessage();
    
    // Redirect to results after 2 seconds
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
  
  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Show loading state
 */
function showLoading() {
  surveyForm.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p style="margin-right: 16px;">טוען סקר...</p>
    </div>
  `;
}

/**
 * Show error message
 */
function showError(message) {
  surveyForm.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #EF4444;">
      <p style="font-size: 1.1rem; font-weight: 600;">${message}</p>
      <button onclick="returnToHome()" style="margin-top: 20px; background: var(--gray-600);">
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
    <div style="text-align: center; padding: 60px 20px;">
      <h3 style="color: var(--primary-blue); font-size: 2rem; margin-bottom: 16px;">
        הסקר נשלח בהצלחה!
      </h3>
      <p style="font-size: 1.1rem; color: var(--gray-600); margin-bottom: 24px;">
        תשובותיך נקלטו בהצלחה במערכת
      </p>
      <p style="color: var(--gray-500);">
        מעביר אותך לעמוד התוצאות...
      </p>
    </div>
  `;
}

/**
 * Ensure options is an array (handle JSON strings from DB)
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

// Make returnToHome available globally for button onclick
window.returnToHome = returnToHome;

// Attach event listener for party cards after the content is in the DOM
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
