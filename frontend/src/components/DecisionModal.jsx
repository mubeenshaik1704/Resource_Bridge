import { useState, useEffect } from 'react';
import { submitOfficerDecision } from '../services/api';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Truck, 
  ShoppingBag, 
  XCircle,
  FileText,
  DollarSign,
  Building2,
  ArrowRight
} from 'lucide-react';

export default function DecisionModal({ 
  isOpen, 
  onClose, 
  allocation, 
  requirement, 
  officerName = 'Dr. Rajesh Sharma', 
  onDecisionSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [decisionType, setDecisionType] = useState('Reallocation Approved');
  const [commentReason, setCommentReason] = useState(
    'Approved reallocation from School A surplus inventory. Transportation to be coordinated via District Education logistics van.'
  );

  // Determine costs based on allocation or fallback defaults
  const repairCost = allocation?.estimatedRepairCost || 2500;
  const transportCost = allocation?.estimatedTransportCost || 4000;
  const procurementCost = allocation?.estimatedProcurementCost || 240000;

  let currentEstimatedCost = transportCost;
  if (decisionType === 'Repair Approved') currentEstimatedCost = repairCost;
  else if (decisionType === 'New Procurement Approved') currentEstimatedCost = procurementCost;
  else if (decisionType === 'Request Rejected') currentEstimatedCost = 0;

  useEffect(() => {
    if (isOpen) {
      setError('');
      setDecisionType('Reallocation Approved');
      setCommentReason(
        'Approved reallocation from School A surplus inventory. Transportation to be coordinated via District Education logistics van.'
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetRequirementId = allocation?.requirementId?._id || allocation?.requirementId || requirement?._id;
  const resourceName = allocation?.resourceName || requirement?.resourceName || 'Resource';
  const recipientSchoolName = allocation?.recipientSchoolId?.schoolName || requirement?.schoolId?.schoolName || 'Recipient School';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentReason.trim()) {
      setError('Please provide mandatory administrative comments / reasons for this decision.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await submitOfficerDecision({
        officerName,
        requirementId: targetRequirementId,
        allocationId: allocation?._id || null,
        decisionType,
        commentReason: commentReason.trim(),
        estimatedCost: currentEstimatedCost
      });
      onDecisionSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to record decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                Education Department Officer Action
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Official Review & Resource Decision
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* School & Resource Context */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Recipient School</span>
              <strong className="text-slate-900 text-sm">{recipientSchoolName}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Requested Resource</span>
              <strong className="text-blue-600 text-sm">{resourceName}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Reviewing Officer</span>
              <strong className="text-slate-900">{officerName}</strong>
            </div>
          </div>

          {/* 3-Way Cost Comparison Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Decision Option (Compare Costs):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 2: Reallocation */}
              <div 
                onClick={() => setDecisionType('Reallocation Approved')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  decisionType === 'Reallocation Approved' 
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Reallocation
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700">Recommended</span>
                  </div>
                  <div className="text-lg font-black text-indigo-950 mt-1">
                    ₹{transportCost.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-indigo-900/80 mt-1">
                    Transfer from School A surplus (13 km transport).
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-bold text-indigo-600 flex items-center">
                  {decisionType === 'Reallocation Approved' ? '✓ Selected' : 'Click to select'}
                </div>
              </div>

              {/* Option 1: Repair */}
              <div 
                onClick={() => setDecisionType('Repair Approved')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  decisionType === 'Repair Approved' 
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-200' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-orange-600" /> Local Repair
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    ₹{repairCost.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Service existing worn equipment locally.
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-bold text-blue-600 flex items-center">
                  {decisionType === 'Repair Approved' ? '✓ Selected' : 'Click to select'}
                </div>
              </div>

              {/* Option 3: Procurement */}
              <div 
                onClick={() => setDecisionType('New Procurement Approved')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  decisionType === 'New Procurement Approved' 
                    ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-200' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-purple-600" /> New Purchase
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    ₹{procurementCost.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Procure brand new units via government tender.
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-bold text-purple-600 flex items-center">
                  {decisionType === 'New Procurement Approved' ? '✓ Selected' : 'Click to select'}
                </div>
              </div>
            </div>

            {/* Option 4: Reject */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setDecisionType('Request Rejected')}
                className={`w-full py-2 px-3 text-xs rounded-lg border font-semibold transition flex items-center justify-center space-x-1.5 ${
                  decisionType === 'Request Rejected'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-200 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Reject Requirement Request (No Allocation or Purchase)</span>
              </button>
            </div>
          </div>

          {/* Mandatory Reason & Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Mandatory Administrative Comments / Reason *</span>
              <span className="text-[10px] font-normal text-slate-400">Recorded for official audit</span>
            </label>
            <textarea
              rows="3"
              required
              placeholder="State the administrative justification, funds allocation head, or reason for this decision..."
              value={commentReason}
              onChange={(e) => setCommentReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-sans"
            ></textarea>
          </div>

          {/* Impact Summary */}
          <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 flex items-center justify-between text-xs text-blue-900">
            <div>
              <span>Approved Expenditure: </span>
              <strong className="text-sm font-black text-blue-950">
                ₹{currentEstimatedCost.toLocaleString()}
              </strong>
            </div>
            <div className="text-[11px] text-blue-700">
              Decision will be signed as: <strong>{officerName}</strong>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Recording Decision...' : 'Confirm & Authorize Decision'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
