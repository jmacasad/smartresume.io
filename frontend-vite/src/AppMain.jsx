import React, { useState, useRef, useEffect } from 'react';
import Banner from './components/Banner';
import { useUser } from './context/UserContext';
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import axios from 'axios';

import 'react-toastify/dist/ReactToastify.css';


function MainInterface() {
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeOutput, setResumeOutput] = useState('');
  const [finalMatchScore, setFinalMatchScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jdSummary, setJdSummary] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [followupQs, setFollowupQs] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupAnswer, setPopupAnswer] = useState('');
  const [previousScore, setPreviousScore] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [analyzedResults, setAnalyzedResults] = useState(null);
  const resumeFileInputRef = useRef(null);
  const [tagValidation, setTagValidation] = useState([]);
  const { user, setUser, isGuest, loading: authLoading, userTier, freeUserUsageCount } = useUser();
  const isPaidUser = userTier === 'paid' || userTier === 'premium';
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [profile, setProfile] = useState();

  


  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get(`${import.meta.env.VITE_API_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setUser(res.data);
      setProfile(res.data);
    })
    .catch(err => {
      console.error('❌ Failed to load profile:', err);
    });
  }, [isLoggedIn]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };
  
  const handleClearAll = () => {
    setJobUrl('');
    setJobText('');
    setResumeText('');
    setResumeOutput('');
    setFinalMatchScore(null);
    setLoading(false);
    setError('');
    setJdSummary('');
    setSummaryText('');
    setFollowupQs([]);
    setCurrentQIndex(0);
    setAnalysisLoading(false);
    setShowPopup(false);
    setPopupAnswer('');
    setPreviousScore(null);
    setSessionId('');
    setAnalyzedResults(null);

    if (resumeFileInputRef.current) {
      resumeFileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    setAnalysisLoading(true);
    setError('');
    setJdSummary('');
    setFollowupQs([]);
    setCurrentQIndex(0);
    setUserAnswers([]);

    setResumeOutput("");
    setSummaryText("");
    setFinalMatchScore(null);
    setPreviousScore(null);
    setAnalyzedResults(null);

    const token = localStorage.getItem("token");

    if (!token) {
      setError("You must be logged in to analyze resumes.");
      setAnalysisLoading(false);
      return;
    }

    // Step 1: Fetch resume from profile
    let resumeFromProfile = "";
    try {
      const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      resumeFromProfile = profileData.summary || profileData.resumeText || "";
    } catch (err) {
      console.error("❌ Failed to fetch resume from profile:", err);
      setError("Failed to load your saved resume. Please check your profile.");
      setAnalysisLoading(false);
      return;
    }

    // Step 2: Call analyze endpoint
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze-jd-vs-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobText, resumeText: resumeFromProfile }),
      });

      const data = await response.json();
      console.log('🔍 API Response:', data);
      console.log("LLM Summary:", data?.analytics?.analysis_summary);
      console.log("LLM Questions:", data?.analytics?.questions);

      if (response.ok) {
        setSessionId(data.session_id);
        setJdSummary((data.summary || '').trim());
        setFollowupQs(data.questions || []);
        if (data.questions && data.questions.length > 0) {
          setUserAnswers(prevAnswers => data.questions.map((_, i) => prevAnswers[i] || ""));
        }
        if (data) {
          setAnalyzedResults(data);
          if (typeof data.match_score === 'number') {
            setPreviousScore(data.match_score);
            setFinalMatchScore(data.match_score);
          }
        } else {
          setError(data.error || 'Invalid analysis response.');
        }
      } else {
        setError(data.error || 'Something went wrong during analysis.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
      console.error(err);
    } finally {
      setAnalysisLoading(false);
    }
  };


  const handleDownload = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to download the resume.");
      return;
    }

    try {
      const response = await fetch('/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId }), // uses session ID from analysis
      });

      if (!response.ok) {
        alert("Failed to download PDF.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tailored_resume.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading the PDF.");
      console.error(err);
    }
  };


  if (authLoading) {
    return <p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading authentication...</p>;
  }
  console.log('🧑‍💼 Profile data:', profile);

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 0 20px rgba(0,0,0,0.2)',
    position: 'relative'
  };

  const modalCloseStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    border: 'none',
    background: 'transparent',
    fontSize: '1.5rem',
    cursor: 'pointer'
  };

  return (
        <div style={{ fontFamily: 'sans-serif' }}>
          <div style={{ position: 'relative', zIndex: 1001 }}>
            <Banner pageName="App" />
          </div>

          <div style={{ padding: '2rem' }}>
      {showLogin && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => setShowLogin(false)} style={modalCloseStyle}>✖</button>
            <LoginForm onLogin={() => {
              setIsLoggedIn(true);
              setShowLogin(false);
            }} />
          </div>
        </div>
      )}

      {showSignup && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => setShowSignup(false)} style={modalCloseStyle}>✖</button>
            <SignUpForm onSignup={() => {
              setIsLoggedIn(true);
              setShowSignup(false);
            }} />
          </div>
        </div>
      )}

     

      <form>
        <label>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={10}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.5rem',
              border: '2px solid #14b8a6',
              borderRadius: '8px',
              zIndex: 0,
              outline: 'none',
              fontSize: '1rem',
              lineHeight: '1.5',
              backgroundColor: '#fff'
            }}
            required
          />
          {profile?.summary && (
            <div style={{
              marginTop: '1rem',
              background: '#f9f9f9',
              padding: '1rem',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.95rem'
            }}>
              <strong>📄 Resume Preview:</strong>
              <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-line' }}>
                {profile.summary.slice(0, 300)}...
              </p>
              <button
                onClick={() => window.location.href = '/setup-profile'}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.4rem 0.8rem',
                  backgroundColor: '#14b8a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ✏️ Edit Resume
              </button>
            </div>
          )}

        </label>
        <br /><br />
        <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#666' }}>
          ✅ Resume data will be retrieved from your profile. Please ensure your profile is complete and accurate.
        </p>
        <br /><br />
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analysisLoading || loading || !jobText.trim()}
          style={{
            marginRight: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: (analysisLoading || loading || !jobText.trim()) ? '#ccc' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: (analysisLoading || loading || !jobText.trim()) ? 'not-allowed' : 'pointer'
          }}
        >
          🔍 {analysisLoading ? 'Analyzing...' : 'Analyse Data'}
        </button>

        <button
          type="button"
          onClick={handleClearAll}
          disabled={analysisLoading || loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: (analysisLoading || loading) ? '#ccc' : '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: (analysisLoading || loading) ? 'not-allowed' : 'pointer'
          }}
        >
          ❌ Clear All
        </button>
        {analysisLoading && (
          <div style={{ marginTop: '1rem', fontStyle: 'italic', color: '#888' }}>
            ⏳ Processing your resume and job description...
          </div>
        )}
        {finalMatchScore !== null && (
          <div style={{ marginTop: '1rem', fontSize: '1.1rem', color: '#333' }}>
            ✅ <strong>Match Score:</strong>{' '}
            <span title="How well your resume matches the job description (based on skills and format).">
              {finalMatchScore}%
            </span>
          </div>
        )}
        {finalMatchScore !== null && (
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => {
                if (isPaidUser) {
                  // 🔧 Replace with your resume optimization trigger
                  console.log("🔓 Optimizing resume...");
                } else {
                  setShowUpgradeModal(true);
                }
              }}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#14b8a6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🚀 Optimize Resume
            </button>
          </div>
        )}
        {jdSummary && (
          <div style={{ marginTop: '2rem', background: '#f1f1f1', padding: '1rem', borderRadius: '8px' }}>
            <h2>📝 Job Description Summary</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{jdSummary}</p>
          </div>
        )}
      </form>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>❌ {error}</p>}

            {showUpgradeModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: '#fff',
                  padding: '2rem',
                  borderRadius: '12px',
                  maxWidth: '420px',
                  textAlign: 'center'
                }}>
                  <h3>🔒 Premium Feature</h3>
                  <p>This feature is available for Pro users. Would you like to:</p>
                  <button onClick={() => window.location.href = '/billing'} style={{
                    margin: '1rem',
                    padding: '0.5rem 1.2rem',
                    backgroundColor: '#14b8a6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    Upgrade to Pro
                  </button>
                  <button onClick={() => setShowUpgradeModal(false)} style={{
                    padding: '0.5rem 1.2rem',
                    backgroundColor: '#ccc',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}


      {(resumeOutput || analyzedResults) && (
        <div style={{ marginTop: '2rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px', lineHeight: '1.6' }}>
          {resumeOutput && (
            <>
              <h2>📄 Tailored Resume:</h2>
              {isPaidUser ? (
                <>
                  {resumeOutput}
                  {user && (
                    <button
                      onClick={handleDownload}
                      style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#14b8a6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      ⬇️ Download PDF
                    </button>
                  )}
                </>
              ) : (
                <div style={{ opacity: 0.5 }}>
                  {resumeOutput}
                  <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#888' }}>
                    Upgrade to unlock full resume and download features.
                  </p>
                </div>
              )}
            </>
          )}
          {analyzedResults?.analytics?.ats_score?.ats_score_total !== undefined && (
            <div style={{ marginTop: '2rem', background: '#eef6f8', padding: '1rem', borderRadius: '8px' }}>
              <h2>🧠 ATS Score Breakdown</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li title="How often job-relevant keywords appear in your resume.">
                  <strong>Keyword Density:</strong> {analyzedResults.analytics.ats_score.keyword_density_score}%
                </li>
                <li title="Assesses visual layout, readability, and formatting best practices.">
                  <strong>Formatting Score:</strong> {analyzedResults.analytics.ats_score.formatting_score} / 20
                </li>
                <li title="Evaluates how compatible your resume file type is with ATS parsing tools.">
                  <strong>File Type Score:</strong> {analyzedResults.analytics.ats_score.file_score} / 10
                </li>
                <li
                  title="Overall ATS score based on keyword use, formatting, and file compatibility."
                  style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}
                >
                  <strong>📊 Total ATS Score:</strong> {analyzedResults.analytics.ats_score.ats_score_total} / 100
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
}
export default MainInterface;