import React, { useState, useEffect } from 'react';
import { Sidebar, ModuleType } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { DisputeTable } from './components/DisputeTable';
import { ModelEvaluationView } from './components/ModelEvaluationView';
import { RiskRatioView } from './components/RiskRatioView';
import { AuditLogsView } from './components/AuditLogsView';
import { CaseDetailModal } from './components/CaseDetailModal';
import { NewCaseModal } from './components/NewCaseModal';
import { ThresholdSettingsModal } from './components/ThresholdSettingsModal';
import { DisputeCase, DashboardStats } from './types';

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('operations');
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedDecision, setSelectedDecision] = useState('');

  // Modals state
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Action pending states
  const [analyzingCaseId, setAnalyzingCaseId] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isSubmittingNewCase, setIsSubmittingNewCase] = useState(false);

  // Thresholds state
  const [weakThreshold, setWeakThreshold] = useState(0.40);
  const [strongThreshold, setStrongThreshold] = useState(0.70);

  // Initial load & search sync
  useEffect(() => {
    fetchCases();
    fetchStats();
    fetchThresholds();
  }, [searchQuery, selectedReason, selectedDecision]);

  const fetchThresholds = async () => {
    try {
      const res = await fetch('/api/risk/ratio-status');
      if (res.ok) {
        const data = await res.json();
        if (data.base_weak_threshold) setWeakThreshold(data.base_weak_threshold);
        if (data.base_strong_threshold) setStrongThreshold(data.base_strong_threshold);
      }
    } catch (err) {
      console.error('Failed to load thresholds:', err);
    }
  };

  const fetchCases = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedReason) params.append('dispute_reason', selectedReason);
      if (selectedDecision) params.append('decision', selectedDecision);

      const res = await fetch(`/api/cases?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
        if (selectedCase) {
          const updated = data.find((c: DisputeCase) => c.case_id === selectedCase.case_id);
          if (updated) setSelectedCase(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleAnalyzeCase = async (caseId: string) => {
    setAnalyzingCaseId(caseId);
    try {
      const res = await fetch(`/api/cases/${caseId}/analyze`, { method: 'POST' });
      if (res.ok) {
        await Promise.all([fetchCases(), fetchStats()]);
        const updatedCases = await (await fetch('/api/cases')).json();
        const updated = updatedCases.find((c: DisputeCase) => c.case_id === caseId);
        if (updated) setSelectedCase(updated);
      }
    } catch (err) {
      console.error('Analyze case error:', err);
    } finally {
      setAnalyzingCaseId(null);
    }
  };

  const handleGenerateResponse = async (caseId: string) => {
    setIsGeneratingResponse(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/generate-response`, { method: 'POST' });
      if (res.ok) {
        await Promise.all([fetchCases(), fetchStats()]);
        const updatedCases = await (await fetch('/api/cases')).json();
        const updated = updatedCases.find((c: DisputeCase) => c.case_id === caseId);
        if (updated) setSelectedCase(updated);
      }
    } catch (err) {
      console.error('Generate response error:', err);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const handleCreateCase = async (caseData: any) => {
    setIsSubmittingNewCase(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });

      if (res.ok) {
        const created = await res.json();
        setIsNewCaseOpen(false);
        await Promise.all([fetchCases(), fetchStats()]);
        setSelectedCase(created);
      } else {
        const err = await res.json();
        alert(`Failed to create dispute case: ${err.message}`);
      }
    } catch (err) {
      console.error('Create case error:', err);
    } finally {
      setIsSubmittingNewCase(false);
    }
  };

  const handleSaveThresholds = async (weak: number, strong: number) => {
    try {
      const res = await fetch('/api/settings/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weak_threshold: weak, strong_threshold: strong }),
      });
      if (res.ok) {
        setWeakThreshold(weak);
        setStrongThreshold(strong);
        await Promise.all([fetchCases(), fetchStats()]);
      }
    } catch (err) {
      console.error('Save thresholds error:', err);
    }
  };

  // Helper to trigger opening settings from module navigation
  const handleSelectModule = (mod: ModuleType) => {
    if (mod === 'settings') {
      setIsSettingsOpen(true);
    } else {
      setActiveModule(mod);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={handleSelectModule}
        onOpenNewCase={() => setIsNewCaseOpen(true)}
        weakThreshold={weakThreshold}
        strongThreshold={strongThreshold}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Top Header */}
        <Header
          activeModule={activeModule}
          onOpenNewCase={() => setIsNewCaseOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Main Workspace Body */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeModule === 'operations' && (
            <div className="space-y-6">
              {/* Operational Stats Bar */}
              <StatsOverview stats={stats} />

              {/* Main Dispute Cases Table */}
              <DisputeTable
                cases={cases}
                loading={loading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedReason={selectedReason}
                setSelectedReason={setSelectedReason}
                selectedDecision={selectedDecision}
                setSelectedDecision={setSelectedDecision}
                onSelectCase={(c) => setSelectedCase(c)}
                onAnalyzeCase={handleAnalyzeCase}
                analyzingCaseId={analyzingCaseId}
              />
            </div>
          )}

          {activeModule === 'risk' && <RiskRatioView />}

          {activeModule === 'model' && <ModelEvaluationView />}

          {activeModule === 'audit' && <AuditLogsView />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-3.5 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700">AI Risk Manager</span>
              <span>&bull;</span>
              <span>Random Forest Classifier (v1.0)</span>
              <span>&bull;</span>
              <span>Three-Zone Policy ({weakThreshold.toFixed(2)} / {strongThreshold.toFixed(2)})</span>
            </div>
            <div>
              <span>Gemini 3.8 Flash Evidence Grounding &bull; Acquirer & Issuer Defense System</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Case Detail Modal */}
      {selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onGenerateResponse={handleGenerateResponse}
          isGeneratingResponse={isGeneratingResponse}
        />
      )}

      {/* New Case Creation Modal */}
      <NewCaseModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        onSubmit={handleCreateCase}
        isSubmitting={isSubmittingNewCase}
      />

      {/* Threshold Settings Modal */}
      <ThresholdSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentWeak={weakThreshold}
        currentStrong={strongThreshold}
        onSave={handleSaveThresholds}
      />
    </div>
  );
}

export default App;
