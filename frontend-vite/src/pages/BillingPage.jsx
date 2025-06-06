// BillingPage.jsx
import React from "react";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logo from "../assets/ro_logo.png"; // Make sure this path points to your logo file

const BillingPage = () => {
  const { user, loading, logout } = useUser();
  const token = localStorage.getItem("token");

  if (loading) return <div>Loading...</div>;

  const handlePremiumCheckout = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/billing/create-checkout-session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user?.email,
        priceId: "price_1RTX8BQLJAUZe4MhYHrkBi8Q",
        domain: window.location.origin,
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout failed");
      console.error(data);
    }
  };

  const plans = [
    {
      title: "Pay Per Use",
      price: "$1.49/session",
      features: ["1 job + resume optimization", "ATS-optimized resume PDF"],
      cta: "Try Now",
      action: () => window.location.href = "/pay-per-use-checkout",
    },
    {
      title: "Standard",
      price: "$8.99/month",
      features: ["20 resume optimizations/month", "PDF downloads", "Job scoring", "Save up to 10 resumes"],
      cta: "Upgrade Now",
      action: () => window.location.href = "/standard-checkout",
    },
    {
      title: "Premium",
      price: "$19.99/month",
      features: ["Unlimited resume matches", "Unlimited AI rewrites", "Priority support", "Resume + cover letter tools"],
      cta: "Go Premium",
      action: handlePremiumCheckout,
    },
    {
      title: "Enterprise",
      price: "Custom Pricing",
      features: ["Multi-seat recruiter access", "Bulk resume processing", "API access (on request)", "Onboarding & priority support"],
      cta: "Contact Sales",
      action: () => window.location.href = "/contact",
    },
  ];

  return (
    <div className="relative bg-white min-h-screen pb-20">
      {/* Wavy header background */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180 z-0">
        <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-24">
          <path d="M-0.84,34.89 C149.99,150.00 271.58,-49.98 503.42,79.99 L500.00,0.00 L0.00,0.00 Z" fill="url(#tealGradient)" />
          <defs>
            <linearGradient id="tealGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#81e6d9" />
              <stop offset="100%" stopColor="#319795" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top nav over the wave */}
      <div className="relative z-10 flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="SmartResume.io Logo" className="h-8 w-8" />
          <span className="text-2xl font-bold text-teal-700">SmartResume.io</span>
        </Link>
        <div className="space-x-4">
          {user ? (
            <>
              <span className="text-gray-700">Welcome, {user.first_name || "User"}</span>
              <button
                onClick={logout}
                className="text-sm text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-full"
              >Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="text-sm text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-full">Log In</button>
              </Link>
              <Link to="/signup">
                <button className="text-sm text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-full">Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="pt-12 px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Pricing that grows with you</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Choose a plan that fits your job search journey. Access cutting-edge resume analysis, AI rewrites, and recruiter tools.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-md p-6 text-center border-t-4 border-teal-400 hover:shadow-xl"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">{plan.title}</h2>
                <p className="text-xl text-teal-600 font-bold mt-2">{plan.price}</p>
              </div>
              <ul className="text-gray-600 mb-6 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <button
                onClick={plan.action}
                className="py-2 px-6 text-white rounded-full bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800"
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
