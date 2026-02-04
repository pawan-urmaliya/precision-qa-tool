
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { QAResult } from '../types';

interface ComparisonReportProps {
  result: QAResult;
  masterImage: string;
  productionImage: string;
  onClose: () => void;
}

const ComparisonReport: React.FC<ComparisonReportProps> = ({ result, masterImage, productionImage, onClose }) => {
  const [opacity, setOpacity] = useState(0.5);
  const data = [
    { value: result.accuracyScore },
    { value: 100 - result.accuracyScore }
  ];
  const COLORS = [result.accuracyScore > 80 ? '#22c55e' : result.accuracyScore > 50 ? '#f59e0b' : '#ef4444', '#1e293b'];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Data': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Layout': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Typography': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 overflow-hidden">
      <div className="bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="bg-blue-600 text-[10px] uppercase px-2 py-1 rounded tracking-widest">Audit Complete</span>
              QA Comparison Report
            </h2>
            <p className="text-slate-400 text-sm mt-1">Detailed AI analysis of production vs specification.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Panel: Stats & Summary */}
          <div className="w-full md:w-1/3 border-r border-slate-800 p-6 overflow-y-auto custom-scrollbar">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400">Accuracy Score</span>
                <span className={`text-2xl font-bold ${result.accuracyScore > 80 ? 'text-green-500' : 'text-amber-500'}`}>{result.accuracyScore}%</span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={180}
                      endAngle={0}
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Executive Summary</h3>
              <p className="text-slate-300 leading-relaxed text-sm bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                {result.summary}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Identified Anomalies</h3>
              <div className="space-y-3">
                {result.differences.map((diff) => (
                  <div key={diff.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-tighter ${getCategoryColor(diff.category)}`}>
                        {diff.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">{diff.description}</p>
                  </div>
                ))}
                {result.differences.length === 0 && (
                  <div className="p-8 text-center bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-green-400 text-sm">Perfect Match! No differences detected.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Visual Delta Overlay */}
          <div className="flex-1 bg-slate-950 flex flex-col">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Visual Delta Overlay</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Master</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={opacity} 
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-32 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-[10px] text-slate-500">Sample</span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative overflow-auto p-12 flex items-center justify-center bg-checkered">
              <div className="relative shadow-2xl shadow-black">
                {/* Master Image (Base) */}
                <img src={masterImage} className="block max-w-none w-[600px] h-auto rounded opacity-30" alt="Master" />
                
                {/* Production Image (Overlay) */}
                <img 
                  src={productionImage} 
                  className="absolute top-0 left-0 w-[600px] h-auto rounded pointer-events-none"
                  style={{ opacity }}
                  alt="Production" 
                />

                {/* AI Error Overlays */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  {result.differences.map((diff) => (
                    <rect
                      key={diff.id}
                      x={`${diff.coords.x / 10}%`}
                      y={`${diff.coords.y / 10}%`}
                      width={`${diff.coords.width / 10}%`}
                      height={`${diff.coords.height / 10}%`}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="animate-pulse"
                    />
                  ))}
                </svg>
              </div>
            </div>
            
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Ghosting mode: superimpose production sample at {Math.round(opacity * 100)}% opacity</p>
            </div>
          </div>

        </div>
      </div>
      
      <style>{`
        .bg-checkered {
          background-image: linear-gradient(45deg, #0f172a 25%, transparent 25%), linear-gradient(-45deg, #0f172a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0f172a 75%), linear-gradient(-45deg, transparent 75%, #0f172a 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
};

export default ComparisonReport;
