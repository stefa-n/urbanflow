import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function AdminReportList({
  reports,
  onReportClick,
  selectedReport,
  onHideReport,
  onDeleteReport,
}) {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityText = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'Ridicată';
      case 'medium':
        return 'Medie';
      case 'low':
        return 'Scăzută';
      default:
        return 'Necunoscută';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Rapoarte</h2>
          <span className="text-sm text-gray-500">{reports.length} total</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>Nu există rapoarte</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`group p-4 cursor-pointer transition-all duration-200 ${
                  selectedReport?.id === report.id 
                    ? 'bg-blue-50 hover:bg-blue-100' 
                    : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => onReportClick(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${getSeverityColor(report.severity)}`}>
                        {getSeverityText(report.severity)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(report.created_at), "d MMMM yyyy 'la' HH:mm", { locale: ro })}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 truncate">{report.type || 'Tip necunoscut'}</h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{report.description || 'Fără descriere'}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {report.published ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onHideReport(report.id);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ascunde"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                          <line x1="2" y1="2" x2="22" y2="22"></line>
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onHideReport(report.id);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Arată"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Sigur doriți să ștergeți acest raport?')) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                      title="Șterge"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 