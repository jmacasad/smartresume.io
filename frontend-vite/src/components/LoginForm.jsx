    import React, { useState } from 'react';
    import axios from 'axios';
    import { useNavigate } from 'react-router-dom';
    import { toast } from 'react-toastify';
    import { signInWithEmailAndPassword } from "firebase/auth";
    import { auth } from "../firebase";
    import { useUser } from '../context/UserContext'; // ✅ Add this import

    export default function LoginForm({ onLogin }) {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const navigate = useNavigate();
      const { setUserProfile } = useUser(); // ✅ Use context

      const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
          // ✅ 1. Log in to Firebase
          const firebaseUser = await signInWithEmailAndPassword(auth, email, password);
          console.log("🔐 Firebase login success:", firebaseUser.user.email);

          // ✅ 2. Log in to Flask backend
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
            email,
            password,
          });

          const token = res.data.access_token;
          console.log("🔐 JWT from Flask:", token);
          localStorage.setItem("token", token);

          // ✅ 3. Init profile with JWT
          try {
            await axios.post(`${import.meta.env.VITE_API_URL}/profile/init`, {}, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            console.log("✅ Profile initialized (or already exists)");
          } catch (err) {
            console.warn("⚠️ Could not init profile:", err);
          }

          // ✅ 4. Fetch profile
          try {
            const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/profile/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            console.log("✅ Loaded profile on login:", profileRes.data);
            setUserProfile(profileRes.data); // ✅ This now works
          } catch (err) {
            console.warn("⚠️ Failed to load profile after login:", err);
          }

          toast.success("Login successful!");
          navigate("/app");
        } catch (err) {
          console.error("❌ Login failed:", err);
          setError("Login failed. Check your email and password.");
          toast.error("Login failed. Check your credentials.");
        } finally {
          setLoading(false);
        }
      };

      return (
        <form onSubmit={handleLogin} style={{ marginTop: '1rem', maxWidth: '400px', margin: 'auto' }}>
          <h2>Login</h2>
          {error && <div style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ marginBottom: '0.5rem', padding: '0.5rem', width: '100%' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ marginBottom: '0.5rem', padding: '0.5rem', width: '100%' }}
          />
          <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', width: '100%' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      );
    }
