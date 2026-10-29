/**
 * AIAssistant.jsx — AI Allocation Decision-Support Panel
 *
 * IMPORTANT:
 *  - This component is READ-ONLY. It never modifies any data.
 *  - It never auto-approves, auto-rejects, or auto-transfers any allocation.
 *  - The final decision ALWAYS remains with the authorized Education Department Officer.
 *  - The AI is called via the backend /api/ai/analyze-allocations endpoint.
 *    The Gemini API key is NEVER exposed to this frontend component.
 */

import { useState } from 'react';
import { analyzeAllocationsWithAI } from '../services/api';
import {
  Sparkles,
  Brain,
  ChevronDown,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  CheckCircle,
  Info,
  Star,
  School as SchoolIcon,
  ArrowRight,
  RefreshCw,
  KeyRound,
  ListOrdered,
} from 'lucide-react';

export default function AIAssistant({ requirements, allocations }) {
  const [selectedReqId, setSelectedReqId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Only show requirements that have at least one Recommended/Pending allocation
  const eligibleReqs = requirements.filter((req) =>
    allocations.some(
      (a) =>
        (a.requirementId === req._id || a.requirementId?._id === req._id) &&
        ['Recommended', 'Pending'].includes(a.status)
    )
  );

  const handleAnalyze = async () => {
    if (!selectedReqId) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await analyzeAllocationsWithAI(selectedReqId);
      if (data.success) {
        setResult(data);
      } else {
        setError(data);
      }
    } catch (err) {
      setError({
        error: err.response?.data?.error || err.message || 'Unknown error',
        errorType: 'NETWORK_ERROR',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setSelectedReqId('');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-700';
    if (score >= 60) return 'text-amber-700';
    return 'text-rose-700';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  };

  const selectedReq = requirements.find((r) => r._id === selectedReqId);

  return (
    <div className="bg-white rounded-xl border border-violet-200 shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-blue-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-violet-100 rounded-lg">
              <Brain className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                AI Allocation Assistant
                <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Powered by Gemini AI
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-powered ranking and analysis of rule-engine allocation candidates.
              </p>
            </div>
          </div>
          {/* Officer decision badge — always visible */}
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Officer Decision Required
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* ── Selector + Analyze Button ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Select a Shortage Requirement to Analyze
            </label>
            {eligibleReqs.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                No active shortage requirements with allocation candidates found.
                Run "Scan for Allocations" in the Potential Allocations tab first.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedReqId}
                  onChange={(e) => {
                    setSelectedReqId(e.target.value);
                    setResult(null);
                    setError(null);
                  }}
                  className="w-full appearance-none border border-slate-200 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 pr-8"
                >
                  <option value="">— Choose a requirement —</option>
                  {eligibleReqs.map((req) => {
                    const allocationCount = allocations.filter(
                      (a) =>
                        (a.requirementId === req._id || a.requirementId?._id === req._id) &&
                        ['Recommended', 'Pending'].includes(a.status)
                    ).length;
                    return (
                      <option key={req._id} value={req._id}>
                        {req.schoolId?.schoolName || req.schoolId} — {req.resourceName} (shortage: {req.shortageQuantity}) [{allocationCount} candidate{allocationCount !== 1 ? 's' : ''}]
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            {result && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
            <button
              onClick={handleAnalyze}
              disabled={!selectedReqId || loading || eligibleReqs.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Analyze Candidates
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Loading State ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3 bg-violet-50 rounded-lg border border-violet-100">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <div>
              <p className="text-sm font-semibold text-violet-800">AI is analyzing allocation candidates…</p>
              <p className="text-xs text-slate-500 mt-1">Evaluating distance, condition, cost, and quantity data</p>
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
              {error.errorType === 'NO_API_KEY' || error.errorType === 'AUTH_ERROR' ? (
                <KeyRound className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              AI Analysis Unavailable
            </div>
            <p className="text-xs text-rose-700">{error.error}</p>
            {(error.errorType === 'NO_API_KEY' || error.errorType === 'AUTH_ERROR') && (
              <div className="bg-white border border-rose-200 rounded-md p-3 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-800">How to enable the AI feature:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Get a free Gemini API key at <span className="font-mono bg-slate-100 px-1 rounded">aistudio.google.com/app/apikey</span></li>
                  <li>Open <span className="font-mono bg-slate-100 px-1 rounded">backend/.env</span></li>
                  <li>Replace <span className="font-mono bg-slate-100 px-1 rounded">your_gemini_api_key_here</span> with your actual key</li>
                  <li>Restart the backend server</li>
                </ol>
              </div>
            )}
            {error.errorType === 'NO_CANDIDATES' && (
              <p className="text-xs text-rose-600 bg-rose-100 rounded px-2 py-1">
                Tip: Go to the "Potential Allocations" tab and click "Scan for Allocations" to generate candidates first.
              </p>
            )}
          </div>
        )}

        {/* ── Analysis Result ── */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Requirement context pill */}
            {selectedReq && (
              <div className="flex items-center flex-wrap gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <SchoolIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-700">{selectedReq.schoolId?.schoolName || 'Recipient School'}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-slate-600">{selectedReq.resourceName}</span>
                <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                  shortage: {selectedReq.shortageQuantity}
                </span>
                <span className="bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded">
                  urgency: {selectedReq.urgency}
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">{result.candidateCount} candidate{result.candidateCount !== 1 ? 's' : ''} analyzed</span>
              </div>
            )}

            {/* Top recommendation summary */}
            {result.analysis?.topRecommendationSummary && (
              <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-violet-800 mb-0.5">AI Summary</p>
                  <p className="text-xs text-violet-700">{result.analysis.topRecommendationSummary}</p>
                </div>
              </div>
            )}

            {/* Ranked candidates */}
            {result.analysis?.rankedCandidates?.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-violet-600" />
                  Ranked Allocation Candidates
                </h5>

                {result.analysis.rankedCandidates.map((candidate, idx) => (
                  <div
                    key={candidate.allocationId || idx}
                    className={`rounded-lg border p-4 ${
                      idx === 0
                        ? 'border-violet-300 bg-violet-50 shadow-sm'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Left: rank + schools */}
                      <div className="flex items-start gap-3">
                        {/* Rank badge */}
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                            idx === 0
                              ? 'bg-violet-600 text-white'
                              : idx === 1
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {candidate.rank}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            {idx === 0 && (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                            )}
                            {candidate.donorSchool}
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            {candidate.recipientSchool}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{candidate.resourceName}</p>

                          {/* Reasons */}
                          {candidate.reasons?.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {candidate.reasons.map((reason, ri) => (
                                <li key={ri} className="flex items-start gap-1.5 text-xs text-slate-700">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Warnings */}
                          {candidate.warnings?.length > 0 && candidate.warnings[0] && (
                            <ul className="mt-1.5 space-y-1">
                              {candidate.warnings.map((w, wi) => (
                                <li key={wi} className="flex items-start gap-1.5 text-xs text-amber-700">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  {w}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Right: score */}
                      <div
                        className={`flex-shrink-0 flex flex-col items-center border rounded-lg px-3 py-2 min-w-[80px] ${getScoreBg(
                          candidate.score
                        )}`}
                      >
                        <div className="flex items-center gap-1">
                          <TrendingUp className={`w-3.5 h-3.5 ${getScoreColor(candidate.score)}`} />
                          <span className={`text-lg font-black ${getScoreColor(candidate.score)}`}>
                            {candidate.score}%
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 text-center leading-tight mt-0.5">
                          AI Recommendation Score
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Alternative options summary (compact) */}
            {result.analysis?.rankedCandidates?.length > 1 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-xs font-bold text-slate-600 mb-2">Alternative Options Summary</p>
                <div className="space-y-1">
                  {result.analysis.rankedCandidates.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        #{c.rank} {c.donorSchool} → {c.recipientSchool}
                      </span>
                      <span className={`font-bold ${getScoreColor(c.score)}`}>{c.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer — always visible */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-800">Important — AI Recommendation Only</p>
                <p className="text-xs text-amber-700">
                  {result.analysis?.disclaimer ||
                    'This is an AI Recommendation Score used for ranking purposes only. It is not a guaranteed probability or certainty. The final allocation decision must be made by the authorized Education Department Officer.'}
                </p>
                <p className="text-xs text-amber-700 font-semibold mt-1">
                  ⚠ To approve or reject an allocation, use the "Review & Decide" button in the Potential Allocations tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Empty state when nothing selected yet ── */}
        {!loading && !result && !error && eligibleReqs.length > 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <Brain className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-semibold text-slate-500">
              Select a requirement above and click "Analyze Candidates"
            </p>
            <p className="text-xs text-slate-400">
              The AI will rank allocation options and explain its reasoning using existing data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
