'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import AdminReportList from '@/components/admin/AdminReportList';
import AdminReportDetails from '@/components/admin/AdminReportDetails';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    checkAdminAndFetchReports();
  }, []);

  const checkAdminAndFetchReports = async () => {
    try {
      const { data: { session } } = await supabaseAdmin.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }


      if (!session?.user?.user_metadata.is_admin) {
         router.push('/404');
         return;
      }

      await fetchReports(session);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchReports = async (session) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedReports = data.map(report => ({
        ...report,
        coordinates: [report.locationx, report.locationy]
      }));
      
      setReports(transformedReports);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const { data: { session } } = await supabaseAdmin.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Nu sunteți autentificat');
      }

      const response = await fetch(`/api/admin/delete-report?id=${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'A apărut o eroare la ștergerea raportului');
      }

      setSelectedReport(null);
      await fetchReports(session);
    } catch (err) {
      setError(err.message);
      console.error('Delete error:', err);
    }
  };

  const handleHideReport = async (reportId) => {
    try {
      const { data: { session } } = await supabaseAdmin.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Nu sunteți autentificat');
      }

      const report = reports.find(r => r.id === reportId);
      if (!report) {
        throw new Error('Raportul nu a fost găsit');
      }

      const { error } = await supabaseAdmin
        .from('reports')
        .update({ published: !report.published })
        .eq('id', reportId);

      if (error) throw error;

      await fetchReports(session);
    } catch (err) {
      setError(err.message);
      console.error('Hide/Show error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Eroare: {error}</div>
      </div>
    );
  }

  const getRandomCenter = () => {
    if (reports.length === 0) return [44.4268, 26.1025];
    const randomIndex = Math.floor(Math.random() * reports.length);
    return reports[randomIndex].coordinates;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Panou Administrare</h1>
            <button
              onClick={() => setShowMap(!showMap)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={showMap ? "Arată harta" : "Arată lista"}
            >
              {showMap ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/>
                  <line x1="15" y1="6" x2="15" y2="21"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <div className={`${showMap ? 'hidden' : 'flex-1'} md:flex-1 md:block bg-white rounded-lg shadow-sm overflow-hidden`}>
          <Map
            reports={reports}
            selectedReport={selectedReport}
            onMarkerClick={(report) => setSelectedReport(report)}
            initialCenter={getRandomCenter()}
          />
        </div>

        <div className={`${showMap ? 'flex-1' : 'hidden'} md:w-1/2 lg:w-2/5 md:block flex flex-col h-[calc(100vh-7rem)]`}>
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <AdminReportList
              reports={reports}
              selectedReport={selectedReport}
              onReportClick={setSelectedReport}
              onHideReport={handleHideReport}
              onDeleteReport={handleDeleteReport}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden h-auto">
            {selectedReport ? (
              <AdminReportDetails report={selectedReport} />
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500 p-4">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>Selectați un raport pentru a vedea detaliile</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 