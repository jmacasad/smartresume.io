import React, { useState } from 'react';

function App() {
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
    setUserAnswers([]);
    setAnalysisLoading(false);
    setShowPopup(false);
    setPopupAnswer('');
    setPreviousScore(null);
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
    const cleaned = raw.replace(/\s*Here’s a tailored.*?\n\n---/s, '');
    return cleaned
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/###\s*(.*?)\n/g, '<h3>$1</h3>')
      .replace(/####\s*(.*?)\n/g, '<h4>$1</h4>')
      .replace(/---+/g, '<hr />')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br />')
      .replace(/^/, '<p>')
      .concat('</p>');
  };

  const handleAnalyze = async () => {
    setAnalysisLoading(true);
    setError('');
    setJdSummary('');
    setFollowupQs([]);
    setCurrentQIndex(0);
    setUserAnswers([]);

    setResumeOutput("");        // 🔁 clear previous resume
    setSummaryText("");         // 🧼 clear summary
    setFinalMatchScore(null);   // 🧼 clear match score
    setPreviousScore(null);     // 🧼 clear previous score

  
    
    try {
      const response = await fetch('http://127.0.0.1:5000/analyze-jd-vs-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobText, resumeText }),
      });
  
      const data = await response.json();
  
      // Debug: Check the data received from the backend
      console.log("💡 Backend Response Data:", data);

  
      if (response.ok) {
          setSessionId(data.session_id);
          setJdSummary((data.summary || '').trim());
          setFollowupQs(data.questions || []);


          console.log("📦 ATS Analytics from Backend:", data.analytics);
          console.log("📊 Parsed Previous Score:", data.analytics?.match_score);

  
        // Handle analytics
        if (data.analytics) {
          console.log("📦 ATS Analytics from Backend:", data.analytics);
          setPreviousScore(typeof data.analytics.match_score === 'number' ? data.analytics.match_score : null);  // Get `previousScore` from backend response
          setFinalMatchScore(null); // No final score yet, waiting for resume generation
        } else {
          setPreviousScore(null);
          setFinalMatchScore(null);
        }
      } else {
        setError(data.error || 'Something went wrong during analysis.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  
  const handleFinalSubmit = async () => {
    setLoading(true);
    setResumeOutput('');
    setError('');

    try {
      // Debug Log: Show the data you're sending in the request
      console.log('🚀 Generating Resume with the following data:', { jobUrl, resumeText, extraAnswers: userAnswers });

      const response = await fetch('http://127.0.0.1:5000/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobText,
          resumeText,
          extraAnswers: userAnswers
        }),
      });

      const data = await response.json();
      // Debug Log: Show the response data from the backend
      console.log('💡 Resume Data Received:', data);
      console.log("📦 Backend full response:", data);
      console.log("📦 Analytics object from backend:", data.analytics);
      console.log("📦 match_score (ATS Optimized):", data.analytics?.match_score ?? 'null or missing');
      console.log("🧠 Final Match Score being set to:", data.analytics?.match_score);

      if (response.ok) {
        const formatted = formatResumeToHTML(data.resume);
        setResumeOutput(formatted);
        setFinalMatchScore(data.analytics?.match_score ?? null);  // This is AFTER ATS optimization
        setSummaryText(data.summary || '');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Could not connect to the server');
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
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
  
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "optimized_resume.pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("❌ Error downloading PDF:", err);
    }
  };
  
  console.log("🔍 Debug Check", {
    followupQs,
    currentQIndex,
    showPopup
  });  

      // ✅ Log ATS scores before render
  console.log("✅ Previous Score:", previousScore);
  console.log("✅ Match Score:", finalMatchScore);

    // return section will be shown separately
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>🎯 Smart Resume Tailor</h1>
    
        <form>
          <label>
            Paste the Job Description:
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={10}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
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
            style={{
              marginRight: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔍 Analyse Data
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ❌ Clear All
          </button>
        </form>
    
        {analysisLoading && <p style={{ marginTop: '1rem' }}>🧠 Analyzing JD vs Resume...</p>}

        {summaryText && (
          <div style={{
            marginTop: '1.5rem',
            background: '#f7f9fc',
            padding: '1rem',
            borderRadius: '8px',
            borderLeft: '5px solid #007bff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}>
            <h3>🧠 Summary</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{summaryText}</p>
          </div>
        )}
    
        {jdSummary && (
          <div style={{
            margin: '1.5rem 0',
            background: '#eef7ff',
            padding: '1.2rem',
            borderLeft: '5px solid #007bff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}>
            <h3>📘 Application Analysis </h3>
            <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{jdSummary}</p>
            <p><em>Click <strong>"Optimize Resume"</strong> below to align your resume with the job’s key requirements and improve your ATS match score.</em></p>
          </div>
        )}
        {followupQs.length > 0 && !showPopup && (
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => {
                setPopupAnswer('');
                setShowPopup(true); // Show the popup only after the analysis
              }}
              style={{
                padding: '0.7rem 1.5rem',
                backgroundColor: '#17a2b8',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              🚀 Optimize Resume
            </button>
          </div>
        )}

    
        {loading && <p style={{ marginTop: '1rem' }}>🌀 Generating tailored resume...</p>}
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>❌ {error}</p>}
    
        {resumeOutput && (
          <div style={{ marginTop: '2rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px', lineHeight: '1.6' }}>
            <h2>📄 Tailored Resume:</h2>
            <div dangerouslySetInnerHTML={{ __html: resumeOutput }} />
          </div>
        )}

        {finalMatchScore !== null && previousScore !== null && (
        <div style={{
          marginTop: '2rem',
          background: '#f0f9ff',
          padding: '1.5rem',
          borderRadius: '10px',
          boxShadow: '0 0 10px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease-in-out'
        }}>
          <h3>📈 ATS Score Comparison</h3>

          <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
            <p><strong>Previous Score:</strong> {previousScore}%</p>
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

            <p><strong>Optimized Score:</strong> {finalMatchScore}%</p>
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
              📥 Download Resume PDF
            </button>
          </div>
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
                <h3>❓ Question {currentQIndex + 1}</h3>
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

                    if (currentQIndex + 1 < followupQs.length) {
                      setCurrentQIndex(currentQIndex + 1);
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
                    marginLeft: '1rem',
                    marginTop: '1rem',
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

                    if (currentQIndex + 1 < followupQs.length) {
                      setCurrentQIndex(currentQIndex + 1);
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
      </div>
    );
}

export default App;
