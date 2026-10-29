import { useState, useEffect } from 'react';
import { 
  createResource, 
  updateResource 
} from '../services/api';
import { 
  Package, 
  X, 
  Save, 
  AlertCircle,
  Building2,
  Tag,
  Hash,
  MapPin,
  Calendar,
  Wrench,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function ResourceModal({ isOpen, onClose, resourceToEdit, schoolId, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    resourceName: '',
    category: 'Computers',
    totalQuantity: 10,
    inUseQuantity: 8,
    unusedQuantity: 2,
    condition: 'In Use',
    goodConditionCount: 8,
    needsRepairCount: 2,
    purchaseYear: new Date().getFullYear(),
    maintenanceStatus: 'Operational',
    schoolLocation: 'IT Lab / Main Building',
    estimatedUnitValue: 30000,
    estimatedRepairCostPerUnit: 2500,
    lifecycleStatus: 'In Use'
  });

  useEffect(() => {
    if (resourceToEdit) {
      setForm({
        resourceName: resourceToEdit.resourceName || '',
        category: resourceToEdit.category || 'Computers',
        totalQuantity: resourceToEdit.totalQuantity ?? 0,
        inUseQuantity: resourceToEdit.inUseQuantity ?? 0,
        unusedQuantity: resourceToEdit.unusedQuantity ?? 0,
        condition: resourceToEdit.condition || 'In Use',
        goodConditionCount: resourceToEdit.goodConditionCount ?? resourceToEdit.totalQuantity ?? 0,
        needsRepairCount: resourceToEdit.needsRepairCount ?? 0,
        purchaseYear: resourceToEdit.purchaseYear || new Date().getFullYear(),
        maintenanceStatus: resourceToEdit.maintenanceStatus || 'Operational',
        schoolLocation: resourceToEdit.schoolLocation || 'Main Building',
        estimatedUnitValue: resourceToEdit.estimatedUnitValue ?? 15000,
        estimatedRepairCostPerUnit: resourceToEdit.estimatedRepairCostPerUnit ?? 1500,
        lifecycleStatus: resourceToEdit.lifecycleStatus || 'In Use'
      });
    } else {
      setForm({
        resourceName: '',
        category: 'Computers',
        totalQuantity: 10,
        inUseQuantity: 8,
        unusedQuantity: 2,
        condition: 'In Use',
        goodConditionCount: 8,
        needsRepairCount: 2,
        purchaseYear: new Date().getFullYear(),
        maintenanceStatus: 'Operational',
        schoolLocation: 'IT Lab / Room 101',
        estimatedUnitValue: 30000,
        estimatedRepairCostPerUnit: 2500,
        lifecycleStatus: 'In Use'
      });
    }
    setError('');
  }, [resourceToEdit, isOpen]);

  if (!isOpen) return null;

  // Auto-calculate unused and goodCondition on total / inUse change
  const handleTotalChange = (val) => {
    const total = Math.max(0, Number(val));
    const inUse = Math.min(total, form.inUseQuantity);
    const unused = Math.max(0, total - inUse);
    setForm({
      ...form,
      totalQuantity: total,
      inUseQuantity: inUse,
      unusedQuantity: unused,
      goodConditionCount: Math.max(0, total - form.needsRepairCount)
    });
  };

  const handleInUseChange = (val) => {
    const inUse = Math.max(0, Number(val));
    const unused = Math.max(0, form.totalQuantity - inUse);
    setForm({
      ...form,
      inUseQuantity: inUse,
      unusedQuantity: unused
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.resourceName.trim()) {
      setError('Resource Name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (resourceToEdit) {
        await updateResource(resourceToEdit._id, form);
      } else {
        await createResource({
          ...form,
          schoolId
        });
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {resourceToEdit ? 'Edit School Resource' : 'Add New School Resource'}
              </h3>
              <p className="text-xs text-slate-300">
                Track quantities, physical conditions, location, and lifecycle status.
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Resource Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resource Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Desktop Computer (i5, 8GB)"
                value={form.resourceName}
                onChange={(e) => setForm({ ...form, resourceName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
          </div>

          {/* Quantities: Total, In Use, Unused */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Quantity Distribution
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Total Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.totalQuantity}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  In Use *
                </label>
                <input
                  type="number"
                  min="0"
                  max={form.totalQuantity}
                  required
                  value={form.inUseQuantity}
                  onChange={(e) => handleInUseChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                  Unused Surplus
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.unusedQuantity}
                  onChange={(e) => setForm({ ...form, unusedQuantity: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs font-bold border border-emerald-300 text-emerald-800 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-emerald-50/50"
                />
              </div>
            </div>
          </div>

          {/* Condition & Lifecycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resource Condition *
              </label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="In Use">In Use</option>
                <option value="Unused">Unused (Surplus)</option>
                <option value="Underutilized">Underutilized (Low Usage)</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Damaged">Damaged / Non-Functional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lifecycle Stage *
              </label>
              <select
                value={form.lifecycleStatus}
                onChange={(e) => setForm({ ...form, lifecycleStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Available">Available (Surplus)</option>
                <option value="In Use">In Use (Active)</option>
                <option value="Underutilized">Underutilized</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Repaired">Repaired / Serviced</option>
              </select>
            </div>
          </div>

          {/* Condition Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Good Condition Units
              </label>
              <input
                type="number"
                min="0"
                value={form.goodConditionCount}
                onChange={(e) => setForm({ ...form, goodConditionCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Units Needing Repair
              </label>
              <input
                type="number"
                min="0"
                value={form.needsRepairCount}
                onChange={(e) => setForm({ ...form, needsRepairCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location & Maintenance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Location / Room *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. IT Lab Room 204"
                value={form.schoolLocation}
                onChange={(e) => setForm({ ...form, schoolLocation: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Year *
              </label>
              <input
                type="number"
                min="2000"
                max={new Date().getFullYear() + 1}
                required
                value={form.purchaseYear}
                onChange={(e) => setForm({ ...form, purchaseYear: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Maintenance Status Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Regularly Serviced, Minor OS issues, Operational"
              value={form.maintenanceStatus}
              onChange={(e) => setForm({ ...form, maintenanceStatus: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Cost Estimates */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Unit Value (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="30000"
                value={form.estimatedUnitValue}
                onChange={(e) => setForm({ ...form, estimatedUnitValue: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Est. Repair Cost / Unit (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="2500"
                value={form.estimatedRepairCostPerUnit}
                onChange={(e) => setForm({ ...form, estimatedRepairCostPerUnit: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : resourceToEdit ? 'Update Resource' : 'Save Resource'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
