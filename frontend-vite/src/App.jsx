import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SetupProfile from './components/SetupProfile';
import Dashboard from './components/Dashboard';
import MainInterface from './AppMain';
import BillingPage from "./pages/BillingPage"; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TermsAndConditions from './pages/terms';


export default function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<MainInterface />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/setup-profile" element={<SetupProfile />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/terms" element={<TermsAndConditions />} />
      </Routes>
    </Router>

    <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
