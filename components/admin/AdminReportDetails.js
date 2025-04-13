import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function AdminReportDetails({ report }) {
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Detalii Raport</h2>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(report.severity)}`}>
          {getSeverityText(report.severity)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium text-gray-500">Tip</div>
          <div className="mt-1 text-sm text-gray-900">{report.type || 'Necunoscut'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Status</div>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              report.published 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
              {report.published ? 'Publicat' : 'Ascuns'}
            </span>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Data Creării</div>
          <div className="mt-1 text-sm text-gray-900">
            {format(new Date(report.created_at), "d MMMM yyyy 'la' HH:mm", { locale: ro })}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Locație</div>
          <div className="mt-1 text-sm text-gray-900">
            {report.locationx.toFixed(6)}, {report.locationy.toFixed(6)}
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-500 mb-2">Descriere</div>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900">
          {report.description || 'Fără descriere'}
        </div>
      </div>

      {report.created_by && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-2">Raportat de</div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-gray-900 font-medium">ID: {report.created_by}</p>
              <p className="text-gray-500">{format(new Date(report.created_at), "'Înregistrat pe' d MMMM yyyy", { locale: ro })}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 