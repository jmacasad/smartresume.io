import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/ro_logo.png';
import LoginButton from '../components/LoginButton';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Hero Section */}
      <section className="px-6 py-20 text-center bg-gray-50">
        <img src={logo} alt="Smart Resume Tailor logo" className="mx-auto w-20 h-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Tailor Your Resume to Any Job Instantly
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Forget generic. Get a resume that speaks the job’s language — AI-tailored, ATS-ready. The simplest, smartest tool you’ll ever use.
        </p>


        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-sm sm:max-w-2xl mx-auto w-full">
          <button
            onClick={() => {
              setShowLogin(true);
              setShowSignup(false);
            }}
            className="flex-1 bg-blue-600 text-white rounded-xl text-lg py-3 px-6 hover:bg-blue-700 transition"
          >
            Login
          </button>

          <button
            onClick={() => {
              setShowSignup(true);
              setShowLogin(false);
            }}
            className="flex-1 bg-green-600 text-white rounded-xl text-lg py-3 px-6 hover:bg-green-700 transition"
          >
            Sign Up
          </button>


        </div>



        {showLogin && (
          <div className="max-w-sm mx-auto mt-6">
            <LoginForm />
          </div>
        )}

        {showSignup && (
          <div className="max-w-sm mx-auto mt-6">
            <SignUpForm />
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-white max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[
            {
              title: "1. Upload Your Resume",
              text: "Supports .docx and .txt formats. Your content stays private and secure.",
            },
            {
              title: "2. Paste the Job Ad URL",
              text: "We extract the job description and analyze required skills, tools, and tone.",
            },
            {
              title: "3. See Resume Match & Insights",
              text: "Get a skill match score and feedback on how your resume aligns with the job.",
            },
            {
              title: "4. Download Optimized Resume",
              text: "Receive a tailored version optimized for ATS and recruiter readability.",
            },
          ].map((step, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg shadow hover:shadow-md transition">
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Optional Signup */}
      <section id="signup" className="bg-blue-50 py-16 text-center px-6">
        <h2 className="text-3xl font-bold mb-4">Be the First to Get Updates</h2>
        <p className="text-gray-600 mb-6">Join our mailing list to stay in the loop about launch features and news.</p>
        <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="you@example.com"
            className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            Join
          </button>
        </form>
      </section>
    </div>
  );
}
