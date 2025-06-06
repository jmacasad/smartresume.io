import React, { useEffect, useState } from 'react';
import Banner from '../components/Banner';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDashboardData(res.data);
      } catch (err) {
        toast.error('Failed to load dashboard');
        setError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) return <div style={{ padding: '2rem' }}>{error}</div>;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ position: 'relative', zIndex: 1001 }}>
        <Banner pageName="Dashboard" />
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Your Resume Analysis History</h2>
        {dashboardData?.matches?.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full text-sm text-left bg-white border border-gray-200">
              <thead className="bg-teal-500 text-white">
                <tr>
                  <th className="px-4 py-2">Activity Date</th>
                  <th className="px-4 py-2">Job Title</th>
                  <th className="px-4 py-2">Analysis Snapshot</th>
                  <th className="px-4 py-2">Before ATS Score</th>
                  <th className="px-4 py-2">After ATS Score</th>
                  <th className="px-4 py-2">Optimized Resume</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.matches.map((match) => (
                  <tr key={match.id} className="border-t">
                    <td className="px-4 py-2">{new Date(match.analyzed_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{match.job_title}</td>
                    <td className="px-4 py-2">{match.snapshot?.slice(0, 100)}...</td>
                    <td className="px-4 py-2">{match.before_score ?? 'N/A'}%</td>
                    <td className="px-4 py-2">{match.after_score ?? 'N/A'}%</td>
                    <td className="px-4 py-2">
                      <button className="bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600">
                        Generate PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No analysis records yet.</p>
        )}
      </div>

    </div>
  );
}
