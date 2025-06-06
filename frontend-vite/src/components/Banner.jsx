import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiHome, FiBarChart2, FiCreditCard } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import React from 'react';
import myLogo from '../assets/ro_logo.png';
import { useUser } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';


export default function Banner({ pageName = "" }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  


  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    color: '#0f766e',
    fontWeight: '500',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    transition: 'background 0.2s',
    cursor: 'pointer'
  };

  const handleLinkClick = () => {
    setShowMenu(false);
  };


  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showMenu]);


  
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(to right, #0d9488, #2dd4bf)' }}>
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <path fill="#14b8a6" fillOpacity="0.3"
          d="M0,64L48,69.3C96,75,192,85,288,122.7C384,160,480,224,576,213.3C672,203,768,117,864,112C960,107,1056,181,1152,186.7C1248,192,1344,128,1392,96L1440,64L1440,0L0,0Z" />
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem 0.5rem', color: '#fff', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={myLogo}
                alt="Logo"
                onClick={() => {
                  setShowMenu(prev => {
                    const next = !prev;
                    console.log('📂 showMenu toggled to:', next);
                    return next;
                  });
                }}
                style={{
                  height: '40px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '2px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  cursor: 'pointer'
                }}
              />

              {showMenu && createPortal(
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: '100px',
                    left: '4rem',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '0.75rem',
                    zIndex: 9999,
                    width: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <Link
                      to="/setup-profile"
                      onClick={handleLinkClick}
                      style={{
                        ...linkStyle,
                        fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e0f7f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                      <FiUser /> Profile
                    </Link>

                    <Link
                      to="/app"
                      onClick={handleLinkClick}
                      style={{
                        ...linkStyle,
                        fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e0f7f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                      <FiHome /> App
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={handleLinkClick}
                      style={{
                        ...linkStyle,
                        fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e0f7f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                      <FiBarChart2 /> Dashboard
                    </Link>

                    <Link
                      to="/billing"
                      onClick={handleLinkClick}
                      style={{
                        ...linkStyle,
                        fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e0f7f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                      <FiCreditCard /> Billing
                    </Link>
                  </motion.div>,
                document.body
              )}

            </div>

            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>SmartResume.io</h1>
          </div>

          {pageName && (
            <div style={{
              marginLeft: '3.5rem',
              fontSize: '0.85rem',
              marginTop: '0.2rem',
              color: '#d1fae5'
            }}>
              <Link to="/" style={{ color: '#d1fae5', textDecoration: 'underline' }}>Home</Link> &gt; {pageName}
            </div>
          )}
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: '#fff', fontSize: '0.95rem' }}>
              Welcome {user.first_name || user.name || 'User'}
            </div>

            <span
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/' // redirect  and refresh
              }}
              style={{ 
                color: '#f0fdfa', 
                textDecoration: 'underline', 
                cursor: 'pointer' 
              }}
            >
              Logout
            </span>
          </div>
        )}
      </div>

      <svg viewBox="0 0 1440 320" preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60px', zIndex: 0 }}>
        <path fill="#0f766e"
          d="M0,64L48,69.3C96,75,192,85,288,122.7C384,160,480,224,576,213.3C672,203,768,117,864,112C960,107,1056,181,1152,186.7C1248,192,1344,128,1392,96L1440,64L1440,320L0,320Z" />
      </svg>
    </div>
  );
}
