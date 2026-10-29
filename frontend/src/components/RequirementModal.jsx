import { useState, useEffect } from 'react';
import { submitRequirement } from '../services/api';
import { 
  AlertCircle, 
  X, 
  Send, 
  Building2, 
  Package, 
  CheckCircle2,
  TrendingDown,
  Info
} from 'lucide-react';

export default function RequirementModal({ isOpen, onClose, schoolId, existingResources = [], onSubmitSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('Computers');
  const [resourceName, setResourceName] = useState('Desktop Computer (i5, 8GB RAM)');
  const [requiredQuantity, setRequiredQuantity] = useState(20);
  const [urgency, setUrgency] = useState('High');
  const [reason, setReason] = useState('Setting up digital literacy lab for Classes 9 and 10.');

  // Calculate currently available resources at this school for the chosen category/name
  const matchingResources = existingResources.filter(
    (r) => r.category === category || r.resourceName.toLowerCase().includes(resourceName.toLowerCase())
  );
  const availableCount = matchingResources.reduce((acc, r) => acc + (r.inUseQuantity || 0) + (r.unusedQuantity || 0), 0);
  const shortageCount = Math.max(0, Number(requiredQuantity || 0) - availableCount);

  useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resourceName.trim()) {
      setError('Please provide a resource name');
      return;
    }
    if (!requiredQuantity || Number(requiredQuantity) <= 0) {
      setError('Required quantity must be greater than zero');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await submitRequirement({
        schoolId,
        resourceName: resourceName.trim(),
        category,
        requiredQuantity: Number(requiredQuantity),
        urgency,
        reason: reason.trim()
      });
      onSubmitSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit requirement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600 rounded-xl text-white shadow-sm">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                School Shortage Submission
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Submit Resource Requirement
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="Computers">Computers</option>
              <option value="Projectors">Projectors</option>
              <option value="Laboratory Equipment">Laboratory Equipment</option>
              <option value="Books">Books & Library</option>
              <option value="Furniture">Furniture (Desks/Benches)</option>
              <option value="Sports Equipment">Sports Equipment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Resource Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Desktop Computer (i5, 8GB RAM)"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Required vs Available & Live Shortage Calculation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Shortage Calculation (Pure Business Logic)
              </span>
              <span className="text-[10px] text-slate-400 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                Non-AI Logic
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Required Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Currently Available in School
                </label>
                <div className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-slate-200/80 border border-slate-300 rounded-lg flex items-center justify-between">
                  <span>{availableCount} units</span>
                  <span className="text-[10px] text-slate-500 font-normal">in inventory</span>
                </div>
              </div>
            </div>

            {/* Prominent Shortage Result Banner */}
            <div className={`p-3 rounded-lg border flex items-center justify-between ${
              shortageCount > 0 
                ? 'bg-rose-50 border-rose-300 text-rose-900' 
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <div className="flex items-center space-x-2">
                {shortageCount > 0 ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {shortageCount > 0 ? `${category} Shortage Detected` : 'No Shortage'}
                  </div>
                  <div className="text-sm font-extrabold mt-0.5">
                    {shortageCount > 0 
                      ? `${resourceName || category} Shortage: ${shortageCount}` 
                      : 'Available quantity meets or exceeds requirement'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xl font-black ${shortageCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {shortageCount}
                </span>
                <span className="text-[10px] block text-slate-500">deficit units</span>
              </div>
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Requirement Urgency
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="Low">Low - Planned for upcoming academic term</option>
              <option value="Medium">Medium - Regular classroom deficit</option>
              <option value="High">High - Core academic subject bottleneck</option>
              <option value="Critical">Critical - Urgent board exams or inspection requirement</option>
            </select>
          </div>

          {/* Reason / Justification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Justification / Reason *
            </label>
            <textarea
              rows="3"
              required
              placeholder="Explain the academic need (e.g. increase in student enrollment in Class 10, damaged equipment replacement, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            ></textarea>
          </div>

          {/* Submit Button */}
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
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting to Department...' : 'Submit to Education Department'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
