import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Banner from './Banner';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { MdAdd, MdDelete } from 'react-icons/md';
import { useUser } from '../context/UserContext';




function SetupProfile() {
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    experience: [
      {
        title: '',
        company: '',
        period: '',
        responsibilities: ''
      }
    ],
    skills: [],
    education: [
      {
        school: '',
        course: '',
        level: ''
      }
    ]
  });
  const [saving, setSaving] = useState(false);
  const { setUserProfile } = useUser();


  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("📄 Selected file:", file);
    setResumeFile(file);

    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file = resumeFile) => {
    if (!file) return;
    setLoading(true);
    setError(null);
   
  const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]; // strip data:... prefix

      try {
        const uploadUrl = `${import.meta.env.VITE_API_URL}/profile/upload-resume`;
        console.log("🌐 Uploading base64 to:", uploadUrl);

        const res = await axios.post(
          uploadUrl,
          { resume_base64: base64 },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log("🧾 Parsed response from upload:", res.data);

        setProfile({
          summary: res.data.summary || '',
          experience: Array.isArray(res.data.experience) ? res.data.experience : [],
          skills: Array.isArray(res.data.skills) ? res.data.skills : [],
          education: Array.isArray(res.data.education) ? res.data.education : []
        });

        toast.success("Resume parsed and profile loaded!");
      } catch (err) {
        console.error("❌ Upload failed", err);
        setError('Upload failed. Please try again.');

        toast.error(
            err?.response?.data?.error || "Failed to parse resume. Please try another file.",
            { toastId: "upload-error" }
          );
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/profile/save`, profile, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Profile saved!');
    } catch (err) {
      toast.error('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (!toast.isActive("missing-token")) {
        toast.error("Missing auth token. Please log in again.", {
          toastId: "missing-token"
        });
      }
      return;
    }

    const url = `${import.meta.env.VITE_API_URL}/profile/me`;
    console.log("🌐 Final profile URL:", url);

    axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log("✅ Profile data:", res.data);
      const raw = res.data;

      setProfile({
        first_name: raw.first_name || '',
        last_name: raw.last_name || '',
        summary: raw.summary || '',
        experience: Array.isArray(raw.experience) ? raw.experience : [],
        skills: typeof raw.skills === 'string'
          ? raw.skills.split(',').map(s => s.trim())
          : Array.isArray(raw.skills)
          ? raw.skills
          : [],
        education: Array.isArray(raw.education) ? raw.education : [],
      });

      setUserProfile(raw);

      const allEmpty =
        res.data.summary?.trim() &&
        res.data.experience?.length === 0 &&
        (!res.data.skills || (typeof res.data.skills === 'string' && !res.data.skills.trim()) || (Array.isArray(res.data.skills) && res.data.skills.length === 0)) &&
        res.data.education?.length === 0;

      if (allEmpty && !toast.isActive("profile-intro-toast")) {
        toast.info("👋 Profile started — upload your resume or complete it manually.", {
          toastId: "profile-intro-toast"
        });
      }
    })
    .catch(err => {
      console.error('❌ Failed to fetch profile', err);

      if (!toast.isActive("profile-fetch-error")) {
        toast.error("Unable to load profile.", {
          toastId: "profile-fetch-error"
        });
      }
    });
  }, []);

  
  console.log("👤 SetupProfile mounted");

  
  
return (
  <>
    <Banner pageName="Profile Page" />
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-xl rounded-2xl border border-gray-100">
      <h2 className="text-2xl font-semibold text-teal-700 mb-4">Setup Your Profile</h2>

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Summary */}
          <div style={{ marginBottom: '1rem' }}>
            <label>Summary:</label>
            <textarea
              placeholder="Enter a short professional summary"
              value={profile.summary}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              rows={4}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        </form>

        <div className="mt-10 mb-4 border-b pb-2 border-gray-200">   <h3 className="text-xl font-semibold text-teal-800">Career Experience</h3> </div>

        <DragDropContext
          onDragEnd={(result) => {
            if (!result.destination) return;
            const updated = Array.from(profile.experience);
            const [movedItem] = updated.splice(result.source.index, 1);
            updated.splice(result.destination.index, 0, movedItem);
            setProfile({ ...profile, experience: updated });
          }}
        >
          <Droppable droppableId="experience" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {profile.experience.map((item, index) => (
                  <Draggable key={`exp-${index}`} draggableId={`exp-${index}`} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginBottom: '1rem',
                          background: '#f9f9f9',
                          ...provided.draggableProps.style
                        }}
                      >
                        <input
                          placeholder="Job Title"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...profile.experience];
                            updated[index].title = e.target.value;
                            setProfile({ ...profile, experience: updated });
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                        />
                        <input
                          placeholder="Company Name"
                          value={item.company}
                          onChange={(e) => {
                            const updated = [...profile.experience];
                            updated[index].company = e.target.value;
                            setProfile({ ...profile, experience: updated });
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                        />
                        <input
                          placeholder="Period"
                          value={item.period}
                          onChange={(e) => {
                            const updated = [...profile.experience];
                            updated[index].period = e.target.value;
                            setProfile({ ...profile, experience: updated });
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                        />
                        <textarea
                          placeholder="Roles and Responsibilities"
                          value={item.responsibilities}
                          onChange={(e) => {
                            const updated = [...profile.experience];
                            updated[index].responsibilities = e.target.value;
                            setProfile({ ...profile, experience: updated });
                          }}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                        />

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...profile.experience];
                              updated.splice(index, 1);
                              setProfile({ ...profile, experience: updated });
                            }}
                            className="flex items-center gap-2 px-3 py-1 mt-2 text-sm text-red-600 bg-red-100 border border-red-400 rounded-md hover:bg-red-200"
                          >

                          <MdDelete size={18} />
                          Delete
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
          <button
            type="button"
            onClick={() => {
              setProfile({
                ...profile,
                experience: [
                  ...profile.experience,
                  { title: '', company: '', period: '', responsibilities: '' }
                ]
              });
            }}
            className="flex items-center gap-2 px-4 py-2 mt-4 text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
          >

          <MdAdd size={20} />
          Add Career Experience
        </button>



        <div className="mt-10 mb-4 border-b pb-2 border-gray-200">   <h3 className="text-xl font-semibold text-teal-800">Skills</h3> </div>

        {profile.skills.length > 0 && (
          <p style={{ fontStyle: 'italic', color: '#4caf50' }}>
            Auto-detected from resume — you can edit below:
          </p>
        )}
      
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {profile.skills.map((skill, index) => (

            <div
              key={index}
              className="flex items-center bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => {
                  const updated = profile.skills.filter((_, i) => i !== index);
                  setProfile({ ...profile, skills: updated });
                }}
                className="ml-2 text-red-500 font-bold hover:text-red-700"
              >
                ×
              </button>
            </div>

          ))}
        </div>

        <input
          type="text"
          placeholder="Type a skill and press Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const newSkill = e.target.value.trim();
              if (newSkill && !profile.skills.includes(newSkill)) {
                setProfile({ ...profile, skills: [...profile.skills, newSkill] });
              }
              e.target.value = '';
            }
          }}
          style={{ width: '100%', padding: '0.5rem' }}
        />


      <div className="mt-10 mb-4 border-b pb-2 border-gray-200">   <h3 className="text-xl font-semibold text-teal-800">Education & Certification</h3> </div>

      {profile.education.map((edu, index) => (
    
        <div
          key={index}
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            background: '#f4f6fa'
          }}
        >
          <input
            placeholder="School Name"
            value={edu.school}
            onChange={(e) => {
              const updated = [...profile.education];
              updated[index].school = e.target.value;
              setProfile({ ...profile, education: updated });
            }}
            className="w-full p-3 border border-gray-300 rounded-lg mb-3"
          />
          <input
            placeholder="Course Name"
            value={edu.course}
            onChange={(e) => {
              const updated = [...profile.education];
              updated[index].course = e.target.value;
              setProfile({ ...profile, education: updated });
            }}
            className="w-full p-3 border border-gray-300 rounded-lg mb-3"
          />
          <input
            placeholder="Education Level (e.g., Bachelor, Diploma)"
            value={edu.level}
            onChange={(e) => {
              const updated = [...profile.education];
              updated[index].level = e.target.value;
              setProfile({ ...profile, education: updated });
            }}
            className="w-full p-3 border border-gray-300 rounded-lg mb-3"
          />
            <button
              type="button"
              onClick={() => {
                const updated = [...profile.experience];
                updated.splice(index, 1);
                setProfile({ ...profile, experience: updated });
              }}
              className="flex items-center gap-2 px-3 py-1 mt-2 text-sm text-red-600 bg-red-100 border border-red-400 rounded-md hover:bg-red-200"
            >

            <MdDelete size={18} />
            Delete
          </button>
        </div>
      ))}
        <button
          type="button"
          onClick={() => {
            setProfile({
              ...profile,
              experience: [
                ...profile.experience,
                { title: '', company: '', period: '', responsibilities: '' }
              ]
            });
          }}
          className="flex items-center gap-2 px-4 py-2 mt-4 text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
        >

        <MdAdd size={20} />
        Add Education Entry
      </button>

      {/* Save Button */}
        <div className="text-center mt-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-lg text-white ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      
       
      {/* Upload */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-2 text-teal-800">Upload Your Resume</h3>
        <input
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-teal-50 file:text-teal-700
            hover:file:bg-teal-100"
        />
      </div>

      

      {loading && (
        <div className="mt-6 flex justify-center">
          <div className="w-6 h-6 border-4 border-teal-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}


      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="z-50"
        toastClassName="rounded-lg shadow-lg"
        bodyClassName="text-sm"
        hideProgressBar={false}
      />

    </div>
  </>
);
}
export default SetupProfile;