import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TermsModal from '../components/TermsModal';
import { toast } from 'react-toastify';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useUser } from '../context/UserContext';



export default function SignUpForm() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [showTerms, setShowTerms] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { setUserProfile } = useUser();
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!agreeToTerms) {
      setError("You must agree to the Terms and Conditions.");
      setLoading(false);
      return;
    }

    try {
      // ✅ 1. Register in Firebase first
      const firebaseUser = await createUserWithEmailAndPassword(auth, form.email, form.password);
      console.log("📧 Firebase user created:", firebaseUser.user.email);

      // ✅ 2. Register in Flask backend
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        password: form.password,
      });

      const token = res.data.access_token;
      console.log("🔐 JWT from Flask:", token);
      localStorage.setItem("token", token);

      // ✅ 3. Init profile using JWT
        await axios.post(`${import.meta.env.VITE_API_URL}/profile/init`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("✅ Profile initialized");

        // ✅ 4. Fetch profile
        try {
          const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/profile/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("✅ Loaded profile:", profileRes.data);
          setUserProfile(profileRes.data);
        } catch (fetchErr) {
          console.warn("⚠️ Failed to load profile after init:", fetchErr);
        }

        toast.success("Signup successful!");
        navigate('/setup-profile');
      } catch (err) {
        console.error("❌ Signup failed:", err);
        setError('Signup failed. Try again.');
        toast.error('Signup failed. Try again.');
      } finally {
        setLoading(false);
      }
  }


  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: 'auto', marginTop: '1rem' }}>
      <h2>Sign Up</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <input
        name="firstName"
        type="text"
        placeholder="First Name"
        value={form.firstName}
        onChange={handleChange}
        required
        style={{ marginBottom: '0.5rem', padding: '0.5rem', width: '100%' }}
      />
      <input
        name="lastName"
        type="text"
        placeholder="Last Name"
        value={form.lastName}
        onChange={handleChange}
        required
        style={{ marginBottom: '0.5rem', padding: '0.5rem', width: '100%' }}
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
        style={{ marginBottom: '0.5rem', padding: '0.5rem', width: '100%' }}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
        style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }}
      />
      <label style={{ display: 'block', marginBottom: '1rem' }}>
        <input
          type="checkbox"
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          required
        />{' '}
        I agree to the 
        <span
          onClick={() => setShowTerms(true)}
          style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
        >
           Terms and Conditions
        </span>
      </label>
      <button
        type="submit"
        disabled={loading || !agreeToTerms}
        style={{
          width: '100%',
          padding: '0.5rem',
          backgroundColor: (!agreeToTerms || loading) ? '#ccc' : '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: (!agreeToTerms || loading) ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s ease'
        }}
      >
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

    </form>
  );
}
