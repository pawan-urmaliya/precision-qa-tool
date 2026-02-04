
import React, { useState, useEffect } from 'react';
import PDFViewer from './components/PDFViewer';
import ComparisonReport from './components/ComparisonReport';
import { performQAComparison } from './services/geminiService';
import { QAResult, ClipRegion } from './types';

const LOADING_MESSAGES = [
  "Initializing Auditor Intelligence...",
  "Performing OCR Extraction...",
  "Analyzing typography weights...",
  "Checking fiber content data...",
  "Measuring sub-pixel layout shifts...",
  "Validating logo positioning...",
  "Finalizing QA deduction scoring..."
];

const App: React.FC = () => {
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [prodFile, setProdFile] = useState<File | null>(null);
  const [masterClip, setMasterClip] = useState<string | null>(null);
  const [prodClip, setProdClip] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [qaResult, setQaResult] = useState<QAResult | null>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isComparing) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isComparing]);

  const handleCompare = async () => {
    if (!masterClip || !prodClip) return;
    
    setIsComparing(true);
    setQaResult(null);
    try {
      const result = await performQAComparison(masterClip, prodClip);
      setQaResult(result);
      setShowReport(true);
    } catch (error) {
      console.error("QA Comparison Failed:", error);
      alert("AI Analysis failed. Please check your API key and try again.");
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight leading-none">Precision QA Tool</h1>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1 inline-block">Apparel Label Audit v3.0</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition-all">
            <span className="text-xs font-medium text-slate-300">Upload Master</span>
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={(e) => setMasterFile(e.target.files?.[0] || null)} 
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition-all">
            <span className="text-xs font-medium text-slate-300">Upload Sample</span>
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={(e) => setProdFile(e.target.files?.[0] || null)} 
            />
          </label>
          
          <button 
            onClick={handleCompare}
            disabled={!masterClip || !prodClip || isComparing}
            className={`px-6 py-2 rounded-lg font-bold text-sm tracking-wide transition-all shadow-xl ${
              masterClip && prodClip && !isComparing
              ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {isComparing ? 'Analyzing...' : 'Execute Comparison'}
          </button>
        </div>
      </header>

      {/* Split View */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-slate-800">
          <PDFViewer 
            file={masterFile} 
            label="Master Specification (Golden Standard)" 
            onClipReady={setMasterClip}
            onSelectionChange={(r) => !r && setMasterClip(null)}
          />
        </div>
        <div className="flex-1">
          <PDFViewer 
            file={prodFile} 
            label="Production Sample (Test Unit)" 
            onClipReady={setProdClip}
            onSelectionChange={(r) => !r && setProdClip(null)}
          />
        </div>
      </main>

      {/* Selection Help / Info Bar */}
      <div className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${masterClip ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
             <span className="text-[10px] text-slate-400 uppercase tracking-widest">Master Region {masterClip ? 'Ready' : 'Pending'}</span>
          </div>
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${prodClip ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
             <span className="text-[10px] text-slate-400 uppercase tracking-widest">Production Region {prodClip ? 'Ready' : 'Pending'}</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 italic">Instruction: Click and drag over label areas in both views to enable comparison.</p>
      </div>

      {/* Loading Overlay */}
      {isComparing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl">
          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-blue-600 animate-progress origin-left" />
          </div>
          <p className="text-lg font-light text-slate-100 animate-pulse">{LOADING_MESSAGES[loadingMsgIdx]}</p>
          <span className="text-xs text-slate-500 mt-2 uppercase tracking-[0.3em]">AI Auditor Processing</span>
        </div>
      )}

      {/* Final Report Modal */}
      {showReport && qaResult && masterClip && prodClip && (
        <ComparisonReport 
          result={qaResult} 
          masterImage={masterClip} 
          productionImage={prodClip} 
          onClose={() => setShowReport(false)}
        />
      )}

      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
