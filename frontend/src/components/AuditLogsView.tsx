import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, ShieldCheck, User, Cpu, RefreshCw, Clock } from 'lucide-react';
import { DisputeCase } from '../types';

export const AuditLogsView: React.FC = () => {
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedActor, setSelectedActor] = useState<string>('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error('Failed to fetch cases for audit logs:', err);
    } fontally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Extract all audit logs across all cases into a flat timeline array
  const allLogs = cases.flatMap((c) =>
    (c.audit_logs || []).map((log) => ({
      ...log,
      case_id: c.case_id,
      merchant_id: c.merchant_id,
      dispute_amount: c.dispute_amount,
    }))
  ).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  // Filter logs
  const filteredLogs = allLogs.filter((log) => {
    const matchesQuery =
      log.case_id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesActor = selectedActor === 'ALL' || log.performed_by === selectedActor;
    return matchesQuery && matchesActor;
  });

  const getActorBadge = (actor: string) => {
    switch (actor) {
      case 'ML_CLASSIFIER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Cpu className="w-3 h-3 mr-1 text-purple-600" />
            ML_CLASSIFIER
          </span>
        );
      case 'OPERATOR':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <User className="w-3 h-3 mr-1 text-blue-600" />
            OPERATOR
          </span>
        );
      case 'SYSTEM':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldCheck className="w-3 h-3 mr-1 text-slate-500" />
            SYSTEM
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700 uppercase tracking-wider">Central Audit Trail</span>
            <span>&bull;</span>
            <span>Immutably Logged System Events</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            System & Decision Audit Logs ({allLogs.length} Events)
          </h2>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search by Case ID, action, or details..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actor Filter Pills */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" />
            Actor:
          </span>
          {['ALL', 'SYSTEM', 'ML_CLASSIFIER', 'OPERATOR'].map((actor) => (
            <button
              key={actor}
              onClick={() => setSelectedActor(actor)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedActor === actor
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {actor}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
            <span>Loading audit log events...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No audit log entries found matching criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 mt-0.5 shrink-0">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{log.case_id}</span>
                      <span>&bull;</span>
                      <span className="text-xs font-semibold text-slate-800">{log.action}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{log.details}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
                  {getActorBadge(log.performed_by)}
                  <span className="text-[11px] font-mono text-slate-400">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
