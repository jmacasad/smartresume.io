import React from 'react';
import Banner from './Banner';

export default function MainLayout({ children }) {
  return (
    <div>
      <Banner />

      {/* Header / Breadcrumb section */}
      <div style={{ padding: '1rem' }}>
        <h1>Welcome back!</h1>
        <nav style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#555' }}>
          Home &gt; Dashboard
        </nav>

        {children}
      </div>
    </div>
  );
}
