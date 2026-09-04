import React, { useState, useEffect } from 'react';
import { DisputeCase, SystemStats } from './types';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { DisputeTable } from './components/DisputeTable';
import { CaseDetailModal } from './components/CaseDetailModal';
import { NewCaseModal } from './components/NewCaseModal';
import { ThresholdSettingsModal } from './components/ThresholdSettingsModal';
import { ModelEvaluationView } from './components/ModelEvaluationView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'operations' | 'model'>('operations');
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedDecision, setSelectedDecision] = useState('');

  // Modals & Active case
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Action pending states
  const [analyzingCaseId, setAnalyzingCaseId] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSubmittingNewCase, setIsSubmittingNewCase] = useState(false);

  // Thresholds state
  const [weakThreshold, setWeakThreshold] = useState(0.40);
  const [strongThreshold, setStrongThreshold] = useState(0.70);

  // Initial load
  useEffect(() => {
    fetchCases();
    fetchStats();
  }, [searchQuery, selectedReason, selectedDecision]);

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
        const updatedRes = await fetch(`/api/cases/${caseId}`);
        if (updatedRes.ok) {
          const updatedCase = await updatedRes.json();
          setSelectedCase(updatedCase);
        }
      } else {
        const err = await res.json();
        alert(`Analysis failed: ${err.message}`);
      }
    } catch (err) {
      console.error('Analysis error:', err);
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
        const updatedRes = await fetch(`/api/cases/${caseId}`);
        if (updatedRes.ok) {
          const updatedCase = await updatedRes.json();
          setSelectedCase(updatedCase);
        }
      } else {
        const err = await res.json();
        alert(`Response drafting rejected: ${err.message}`);
      }
    } catch (err) {
      console.error('Response drafting error:', err);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/cases/reset-demo', { method: 'POST' });
      if (res.ok) {
        await Promise.all([fetchCases(), fetchStats()]);
        if (selectedCase) {
          setSelectedCase(null);
        }
      }
    } catch (err) {
      console.error('Reset demo error:', err);
    } finally {
      setIsResetting(false);
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

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetDemo={handleResetDemo}
        onOpenNewCase={() => setIsNewCaseOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'operations' ? (
          <div>
            {/* Operational Stats Bar */}
            <StatsOverview stats={stats} />

            {/* Main Dispute Cases Table */}
            <DisputeTable
              cases={cases}
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
        ) : (
          /* ML Model Evaluation Dashboard */
          <ModelEvaluationView />
        )}
      </main>

      {/* Case Detail Dossier & Defense Modal */}
      <CaseDetailModal
        disputeCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onAnalyze={handleAnalyzeCase}
        onGenerateResponse={handleGenerateResponse}
        isAnalyzing={analyzingCaseId === selectedCase?.case_id}
        isGeneratingResponse={isGeneratingResponse}
      />

      {/* Ingest New Case Modal */}
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Chargeback Evidence Responder</span>
            <span>&bull;</span>
            <span>ML Random Forest Classifier (v1.0)</span>
            <span>&bull;</span>
            <span>Three-Zone Threshold Policy (0.40 / 0.70)</span>
          </div>
          <div>
            <span>Gemini 3.8 Flash Evidence Grounding &bull; Acquirer & Issuer Defense System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
