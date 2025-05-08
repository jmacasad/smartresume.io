import React, { useState, useRef } from 'react';
import SafeMarkdown from './components/SafeMarkdown';
import myLogo from './assets/ro_logo.png';
import { useUser } from './context/UserContext';





function AppMain() {
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
  const [analyzedResults, setAnalyzedResults] = useState(null); // --- NEW STATE ---
  const resumeFileInputRef = useRef(null);
  const [tagValidation, setTagValidation] = useState([]);
  const { user, isGuest, loading: authLoading, userTier, setUserTier, freeUserUsageCount } = useUser();
  const [manualSessionId, setManualSessionId] = useState('');
  const canAccessPremiumBlocks = userTier === 'paid' || userTier === 'premium' || (userTier === 'free' && freeUserUsageCount < 3);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  console.log("🔍 Current Tier:", userTier);



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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target.result);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        setResumeText(base64);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Unsupported file type. Please upload a .txt or .docx file.');
    }
  };

  const formatResumeToHTML = (raw) => {
    console.log("💡 raw input to formatResumeToHTML:", raw);
    if (!raw) return null;
  
    try {
      const safeRaw = typeof raw === 'string'
        ? raw
        : JSON.stringify(raw);
  
      return (
        <div className="resume-container">
          <SafeMarkdown>{safeRaw}</SafeMarkdown>
        </div>
      );
    } catch (err) {
      console.error("❌ Error formatting resume:", err, raw);
      return <div><span role="img" aria-label="warning">⚠️</span> Unable to render resume</div>;
    }
  };
  
  
  const handleAnalyze = async () => {
    setAnalysisLoading(true);
    setError('');
    setJdSummary('');
    setFollowupQs([]);
    setCurrentQIndex(0);
    setUserAnswers([]);

    // Reset output states from previous runs
    setResumeOutput("");
    setSummaryText("");
    setFinalMatchScore(null);
    setPreviousScore(null);
    setAnalyzedResults(null); // --- RESET NEW STATE ---


    try {
      console.log('🚀 Sending data for analysis:', { jobText: jobText.substring(0, 200) + '...', resumeText: resumeText.substring(0, 200) + '...' });

      const response = await fetch('http://127.0.0.1:5000/analyze-jd-vs-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobText, resumeText }),
      });

      const data = await response.json();

      console.log("💡 Backend Response Data (Analyze):", data);

      if (response.ok) {
          setSessionId(data.session_id);
          setJdSummary((data.summary || '').trim());
          setFollowupQs(data.questions || []);

          if (data.questions && data.questions.length > 0) {
            setUserAnswers(prevAnswers => data.questions.map((_, i) => prevAnswers[i] || "")
            );
          }

          if (data.analytics) {
            console.log("📦 ATS Analytics from Backend (Analyze):", data.analytics);
            const initialScore = typeof data.analytics.match_score === 'number' ? data.analytics.match_score : null;
            console.log("🧠 Setting previousScore to:", initialScore);
            setPreviousScore(initialScore);
            setFinalMatchScore(null);
            setAnalyzedResults(data.analytics); // --- SAVE ANALYTICS DATA ---
            console.log("📦 Stored analyzedResults:", data.analytics);
          } else {
            console.warn("Backend did not return analytics in analysis step. previousScore will be null.");
            setPreviousScore(null);
            setFinalMatchScore(null);
            setAnalyzedResults(null); // Ensure null if no analytics
          }
      } else {
        console.error("Backend error during analysis:", data.error);
        setError(data.error || 'Something went wrong during analysis.');
        setPreviousScore(null);
        setFinalMatchScore(null);
        setAnalyzedResults(null); // Ensure null if analysis fails
      }
    } catch (err) {
      console.error('Frontend fetch error during analyze-jd-vs-resume:', err);
      setError('Could not connect to the server.');
      setPreviousScore(null);
      setFinalMatchScore(null);
      setAnalyzedResults(null); // Ensure null if analysis fails
    } finally {
      console.log("Analysis process completed (either success or error).");
      setAnalysisLoading(false);
    }
  };


  const handleFinalSubmit = async () => {
    setLoading(true);
    setResumeOutput('');
    setError('');

    try {
      // Debug Log: Show the data you're sending in the request
      console.log('🚀 Generating Resume with the following data:', {
        jobUrl, // Note: jobUrl is not used in backend /generate-resume payload
        resumeText: resumeText.substring(0, 200) + '...',
        extraAnswers: userAnswers,
        sessionId,
        analyzedData: analyzedResults // --- SEND STORED ANALYTICS DATA ---
      });

      const response = await fetch('http://127.0.0.1:5000/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobText, // Backend uses jobText, not jobUrl
          resumeText,
          extraAnswers: userAnswers,
          analyzedData: analyzedResults, // <--- ADD THIS LINE
          userTier, // Send user tier to backend
          freeUserUsageCount, // Send free user usage count to backend
          sessionId: sessionId
        }),
      });

      if (response.status === 403 && userTier === 'free') {
        setShowUpgradeModal(true);
        return;
      }

      const data = await response.json();
      console.log('💡 Resume Data Received:', data);
      console.log("📦 Backend full response:", data);
      console.log("📦 Analytics object from backend:", data.analytics);
      console.log("🧠 Value attempting to set finalMatchScore to:", data.analytics?.match_score);

      if (response.ok) {
        console.log("✨ Formatted resume HTML preview:", data.resume?.slice(0, 200));
        setResumeOutput(formatResumeToHTML(data.resume));
        const calculatedFinalScore = data.analytics?.match_score ?? null;
        setTagValidation(data.analytics?.tag_validation || []);
        console.log("Setting finalMatchScore to:", calculatedFinalScore);
        setFinalMatchScore(calculatedFinalScore);
        setSummaryText(data.summary || '');

        if (userTier === 'free') {
          setFreeUserUsageCount((prev) => prev + 1);
          console.log("📊 Free user usage incremented");
        }

      } else {
        console.error("Backend error during generation:", data.error);
        setError(data.error || 'Something went wrong');
        setFinalMatchScore(null);
      }
    } catch (err) {
      console.error('Frontend fetch error during generate-resume:', err);
      setError('Could not connect to the server');
      setFinalMatchScore(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadResumePDF = async () => {
    if (!sessionId) {
      console.error("Missing session ID!");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/download-resume/${sessionId}`);
      // Check if the response indicates an error (e.g., 404 if session file not found)
      if (!response.ok) {
         console.error("❌ Backend error during PDF download attempt:", response.status, response.statusText);
         // Backend's download_resume endpoint sends text on PDF failure,
         // so this initial fetch should receive *something* if the session exists.
         // If it fails here, maybe the session ID is bad or the backend had a problem.
         // Let the catch block handle it, or add specific status checks if needed.
      }

      // The backend's /download-resume endpoint will send either a PDF or a TXT file.
      // We need to check the content type to handle it correctly on the frontend.
      const contentType = response.headers.get('content-type');
      console.log("📄 Download response content type:", contentType);


      if (contentType && contentType.includes('application/pdf')) {
         console.log("Received PDF, attempting download...");
         const blob = await response.blob();
         const url = window.URL.createObjectURL(new Blob([blob]));

         const link = document.createElement("a");
         link.href = url;
         link.setAttribute("download", `optimized_resume_${sessionId.substring(0, 8)}.pdf`);
         document.body.appendChild(link);
         link.click();
         link.parentNode.removeChild(link);
         window.URL.revokeObjectURL(url); // Clean up the URL object
         console.log("PDF download link clicked.");

      } else if (contentType && contentType.includes('text/plain')) {
          console.log("Received plain text (likely PDF generation failed on backend), attempting text download...");
           const blob = await response.blob(); // Get the blob for text
           const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/plain' }));

           const link = document.createElement("a");
           link.href = url;
           link.setAttribute("download", `optimized_resume_${sessionId.substring(0, 8)}.txt`);
           document.body.appendChild(link);
           link.click();
           link.parentNode.removeChild(link);
           window.URL.revokeObjectURL(url); // Clean up the URL object
           console.log("Text download link clicked.");
           alert("PDF generation failed on the server, but the text resume was downloaded instead.");

      } else {
          console.error("❌ Unexpected content type received during download:", contentType);
          alert("Received unexpected file format from the server.");
      }


    } catch (err) {
      console.error("❌ Error fetching resume for download:", err);
      alert("Failed to download resume. Please check the server logs.");
    }
  };

  const handleLoadSession = async () => {
    if (!manualSessionId.trim()) return;
  
    try {
      const response = await fetch(`http://127.0.0.1:5000/session/${manualSessionId}`);
      const data = await response.json();
  
      if (response.ok) {
        setSessionId(manualSessionId);
        setResumeOutput(formatResumeToHTML(data.resume));
        setPreviousScore(data.analytics?.match_score || null);
        setFinalMatchScore(data.analytics?.final_score || null);
        setSummaryText(data.summary || '');
        setTagValidation(data.analytics?.tag_validation || []);
        setAnalyzedResults(data.analytics || {});
      } else {
        alert(data.error || "Failed to load session.");
      }
    } catch (err) {
      console.error("Error loading session:", err);
      alert("Failed to connect to backend.");
    }
  };

  const devButtonStyle = {
    marginRight: '0.5rem',
    padding: '0.4rem 0.8rem',
    backgroundColor: '#eee',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer'
  };
  
  

  // --- REMOVED downloadResumeText function ---


  console.log("🔍 Debug Check", {
    followupQs,
    currentQIndex,
    showPopup,
    previousScore, // Check previous score state
    finalMatchScore // Check final score state
  });

  if (authLoading) {
    return <p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading authentication...</p>;
  }

    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={myLogo} alt="Smart Resume Tailor logo" style={{ height: '48px' }} />
          <h1 style={{ margin: 0 }}>Smart Resume Tailor</h1>
        </div>
        <div style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
          <label>
            Load Previous Session by ID:
            <input
              type="text"
              value={manualSessionId}
              onChange={(e) => setManualSessionId(e.target.value)}
              placeholder="Enter session ID"
              style={{
                marginLeft: '1rem',
                padding: '0.4rem 0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          <button
            onClick={handleLoadSession}
            style={{
              marginLeft: '1rem',
              padding: '0.4rem 1rem',
              backgroundColor: '#14b8a6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 Load Session
          </button>
          {/* 🧪 Dev Tier Switch Buttons (Only visible in Dev Mode) */}
            <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Switch Tier (Dev Only):</strong>
              <button onClick={() => setUserTier('guest')} style={devButtonStyle}>👤 Guest</button>
              <button onClick={() => setUserTier('free')} style={devButtonStyle}>🆓 Free (Signed-In)</button>
              <button onClick={() => setUserTier('paid')} style={devButtonStyle}>💳 Paid</button>
              <button onClick={() => setUserTier('premium')} style={devButtonStyle}>🌟 Premium</button>
            </div>


        </div>
      {isGuest && (
        <div style={{
          marginTop: '1rem',
          backgroundColor: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeeba',
          padding: '0.75rem 1.25rem',
          borderRadius: '6px',
          marginBottom: '1.5rem'
        }}>
          <strong>You're using the app as a guest.</strong> Sign in to save your resume sessions and access them across devices.
        </div>
      )}

      {userTier !== 'premium' && (
        <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setUserTier('paid')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#14b8a6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            🔓 Unlock Paid Features (Dev Mode)
          </button>

          <button
            onClick={() => {
              localStorage.setItem('freeUserUsageCount', '0');
              window.location.reload();
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ♻️ Reset Free Usage Count
          </button>
        </div>
      )}


        <form>
          <label>
            Paste the Job Description:
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={10}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                marginTop: '0.5rem',
                border: '2px solid #14b8a6',      // teal border
                borderRadius: '8px',
                outline: 'none',
                fontSize: '1rem',
                lineHeight: '1.5',
                backgroundColor: '#fff'
               }}
              required
            />
          </label>


          <br /><br />

          <label>
            Upload Your Resume (.txt or .docx):
            <input
              type="file"
              accept=".txt,.docx"
              onChange={handleFileUpload}
              style={{ marginTop: '0.5rem' }}
              required
            />
          </label>

          <br /><br />

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analysisLoading || loading || !jobText.trim() || !resumeText} // Disable if loading or inputs are empty
            style={{
              marginRight: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: (analysisLoading || loading || !jobText.trim() || !resumeText) ? '#ccc' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: (analysisLoading || loading || !jobText.trim() || !resumeText) ? 'not-allowed' : 'pointer'
            }}
          >
            <span role="img" aria-label="magnifying glass">🔍</span> {analysisLoading ? 'Analyzing...' : 'Analyse Data'}
          </button>

          <button
            type="button"
            onClick={handleClearAll}
             disabled={analysisLoading || loading} // Disable clear during processing
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: (analysisLoading || loading) ? '#ccc' : '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: (analysisLoading || loading) ? 'not-allowed' : 'pointer'
            }}
          >
            <span role="img" aria-label="cross mark">❌</span> Clear All
          </button>
        </form>

        {analysisLoading && <p style={{ marginTop: '1rem' }}><span role="img" aria-label="brain">🧠</span> Analyzing JD vs Resume...</p>}

        {/* Moved Summary and Analysis sections */}

        {jdSummary && (
          <div style={{
            margin: '1.5rem 0',
            background: '#eef7ff',
            padding: '1.2rem',
            borderLeft: '5px solid #007bff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}>
            <h3><span role="img" aria-label="book">📘</span> Application Analysis </h3>
            <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{jdSummary}</p>
            {/* Display initial score from previousScore state */}
             {previousScore !== null && (
                 <p><strong>Initial ATS Score:</strong> {previousScore}%</p>
             )}
            <p><em>Click <strong>"Optimize Resume"</strong> below to align your resume with the job’s key requirements and improve your ATS match score.</em></p>
          </div>
        )}

        {followupQs.length > 0 && !showPopup && (
          <div style={{ marginTop: '1.5rem' }}>
            {(userTier === 'guest' || (userTier === 'free' && freeUserUsageCount >= 3)) ? (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeeba',
                borderRadius: '6px'
              }}>
                <strong>Upgrade Required:</strong> You’ve reached the free usage limit. Sign in or upgrade to continue optimizing resumes.
              </div>
            ) : (
              <button
                onClick={() => {
                  setCurrentQIndex(0);
                  const initialAnswer = userAnswers[0] || '';
                  setPopupAnswer(initialAnswer);
                  setShowPopup(true);
                }}
                disabled={loading || analysisLoading}
                style={{
                  padding: '0.7rem 1.5rem',
                  backgroundColor: (loading || analysisLoading) ? '#ccc' : '#17a2b8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: (loading || analysisLoading) ? 'not-allowed' : 'pointer'
                }}
              >
                🚀 Optimize Resume
              </button>
            )}
          </div>
        )}

        {loading && <p style={{ marginTop: '1rem' }}><span role="img" aria-label="spinning">🌀</span> Generating tailored resume...</p>}
        {error && <p style={{ color: 'red', marginTop: '1rem' }}><span role="img" aria-label="cross mark">❌</span> {error}</p>}

        {/* Display generated resume first if available */}
        {resumeOutput && (
          <div style={{ marginTop: '2rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px', lineHeight: '1.6' }}>
            <h2><span role="img" aria-label="page">📄</span> Tailored Resume:</h2>

            {userTier === 'guest' && (
              <div style={{ opacity: 0.4 }}>
                <p style={{ color: '#888' }}>Sign in to view your tailored resume.</p>
              </div>
            )}

            {userTier === 'free' && freeUserUsageCount >= 3 && (
              <div style={{ opacity: 0.5 }}>
                <p style={{ color: '#888' }}>Free plan limit reached. Upgrade to unlock full resume view.</p>
              </div>
            )}

            {userTier === 'free' && freeUserUsageCount < 3 && (
              <div style={{ opacity: 0.6 }}>
                {resumeOutput}
                <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#888' }}>
                  Upgrade to unlock full resume and download features.
                </p>
              </div>
            )}

            {(userTier === 'paid' || userTier === 'premium') && (
              resumeOutput
            )}
          </div>
        )}

        {/* Display ATS Score Comparison block ONLY if both scores are available */}
        {userTier !== 'guest' && previousScore !== null && finalMatchScore !== null && (
        <div style={{
          marginTop: '2rem',
          background: '#f0f9ff',
          padding: '1.5rem',
          borderRadius: '10px',
          boxShadow: '0 0 10px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease-in-out'
        }}>
          <h3><span role="img" aria-label="chart increasing">📈</span>ATS Score Comparison</h3>

          <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
            <p><strong>Initial Score:</strong> {previousScore}%</p> {/* Display initial score here */}
            <div style={{
              height: '20px',
              background: '#eee',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '0.8rem',
              transition: 'all 0.3s ease-in-out'
            }}>
              <div style={{
                width: `${previousScore}%`,
                backgroundColor: previousScore >= 80 ? '#28a745' : previousScore >= 50 ? '#ffc107' : '#dc3545',
                height: '100%',
                transition: 'width 1.2s ease-in-out'
              }} />
            </div>

            <p><strong>Optimized Score:</strong> {finalMatchScore}%</p> {/* Display final score here */}
            {(userTier === 'paid' || userTier === 'premium' || (userTier === 'free' && freeUserUsageCount < 3)) && tagValidation.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4><span role="img" aria-label="checklist">✅</span> Skill Tag Validation</h4>
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {tagValidation.map((tag, idx) => (
                    <li key={idx} style={{
                      padding: '0.3rem 0.5rem',
                      backgroundColor: tag.present ? '#d4edda' : '#f8d7da',
                      color: tag.present ? '#155724' : '#721c24',
                      borderLeft: `5px solid ${tag.present ? '#28a745' : '#dc3545'}`,
                      marginBottom: '0.5rem',
                      borderRadius: '4px'
                    }}>
                      {tag.tag} – {tag.present ? '✓ Inserted' : '⚠️ Missing'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(userTier === 'paid' || userTier === 'premium' || (userTier === 'free' && freeUserUsageCount < 3)) && (
              <div style={{
                height: '20px',
                background: '#eee',
                borderRadius: '10px',
                overflow: 'hidden',
                transition: 'all 0.3s ease-in-out'
              }}>
                <div style={{
                  width: `${finalMatchScore}%`,
                  backgroundColor: finalMatchScore >= 80 ? '#28a745' : finalMatchScore >= 50 ? '#ffc107' : '#dc3545',
                  height: '100%',
                  transition: 'width 1.2s ease-in-out'
                }} />
              </div>
            )}
            {(userTier === 'paid' || userTier === 'premium' || (userTier === 'free' && freeUserUsageCount < 3)) ? (
              <button
                onClick={downloadResumePDF}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <span role="img" aria-label="download">📥</span> Download Resume PDF
              </button>
            ) : (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeeba',
                borderRadius: '6px'
              }}>
                <strong>Limit Reached:</strong> You’ve used your 3 free resume generations. Upgrade to download your resume as a PDF.
              </div>
            )}


          </div>
          </div>
      )}

        {/* Moved Summary Text section */}
         {summaryText && (
          <div style={{
            marginTop: '1.5rem',
            background: '#f7f9fc',
            padding: '1rem',
            borderRadius: '8px',
            borderLeft: '5px solid #007bff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}>
            <h3><span role="img" aria-label="brain">🧠</span> AI Summary</h3> {/* Changed title */}
            <p style={{ whiteSpace: 'pre-wrap' }}>{summaryText}</p>
          </div>
        )}


        {showPopup && followupQs.length > 0 && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <div style={{
                backgroundColor: '#fff',
                padding: '2rem',
                borderRadius: '10px',
                width: '90%',
                maxWidth: '600px',
                boxShadow: '0 0 20px rgba(0,0,0,0.2)'
              }}>
                <h3><span role="img" aria-label="question mark">❓</span> Question {currentQIndex + 1} of {followupQs.length}</h3> {/* Added total questions */}
                <p>{followupQs[currentQIndex]}</p>
                <textarea
                  rows={4}
                  maxLength={300}
                  placeholder="Max 300 characters. Focus on one project or skill you want highlighted."
                  value={popupAnswer}
                  onChange={(e) => setPopupAnswer(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
                <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem' }}>
                  {popupAnswer.length}/300 characters
                </div>
                <br />
                <button
                  disabled={!popupAnswer.trim()}
                  style={{
                    marginTop: '1rem',
                    marginRight: '1rem',
                    padding: '0.5rem 1.5rem',
                    backgroundColor: popupAnswer.trim() ? '#007bff' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: popupAnswer.trim() ? 'pointer' : 'not-allowed'
                  }}
                  onClick={() => {
                    const updatedAnswers = [...userAnswers];
                    updatedAnswers[currentQIndex] = popupAnswer.trim();
                    setUserAnswers(updatedAnswers);
                    setPopupAnswer('');

                    const nextIndex = currentQIndex + 1;
                    if (nextIndex < followupQs.length) {
                      setCurrentQIndex(nextIndex);
                      setPopupAnswer(updatedAnswers[nextIndex] || '');
                    } else {
                      setShowPopup(false);
                      handleFinalSubmit();
                    }
                  }}
                >
                  {currentQIndex + 1 < followupQs.length ? 'Next' : 'Generate Resume'}
                </button>
                <button
                  style={{
                    marginLeft: '1rem', // Changed from 'marginTop'
                    marginTop: '1rem', // Keep margin top if needed
                    padding: '0.5rem 1.5rem',
                    backgroundColor: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const updatedAnswers = [...userAnswers];
                    updatedAnswers[currentQIndex] = ""; // Empty answer to indicate skipped
                    setUserAnswers(updatedAnswers);
                    setPopupAnswer('');

                    const nextIndex = currentQIndex + 1;
                    if (nextIndex < followupQs.length) {
                      setCurrentQIndex(nextIndex);
                      setPopupAnswer(updatedAnswers[nextIndex] || '');
                    } else {
                      setShowPopup(false);
                      handleFinalSubmit();
                    }
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        {showUpgradeModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '2rem',
              borderRadius: '10px',
              width: '90%',
              maxWidth: '600px',
              boxShadow: '0 0 20px rgba(0,0,0,0.2)'
            }}>
              <h3><span role="img" aria-label="lock">🔒</span> Upgrade Required</h3>
              <p>You’ve reached the free usage limit. Sign in or upgrade to continue optimizing resumes.</p>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        

      </div>
    );
}

export default AppMain;