import { useState, useEffect } from 'react';
import { updateSchoolProfile } from '../services/api';
import { 
  Building2, 
  X, 
  Save, 
  AlertCircle,
  Users,
  GraduationCap,
  Phone,
  User,
  MapPin
} from 'lucide-react';

export default function SchoolProfileModal({ isOpen, onClose, school, onUpdateSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    studentCount: 0,
    classroomCount: 0,
    principalName: '',
    contactNumber: '',
    address: ''
  });

  useEffect(() => {
    if (school) {
      setForm({
        studentCount: school.studentCount || 0,
        classroomCount: school.classroomCount || 0,
        principalName: school.principalName || '',
        contactNumber: school.contactNumber || '',
        address: school.address || ''
      });
      setError('');
    }
  }, [school, isOpen]);

  if (!isOpen || !school) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updated = await updateSchoolProfile(school._id, form);
      onUpdateSuccess(updated);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Update School Profile</h3>
              <p className="text-xs text-slate-300">{school.schoolName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Count *
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.studentCount}
                onChange={(e) => setForm({ ...form, studentCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classroom Count *
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.classroomCount}
                onChange={(e) => setForm({ ...form, classroomCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Principal Name
            </label>
            <input
              type="text"
              value={form.principalName}
              onChange={(e) => setForm({ ...form, principalName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={form.contactNumber}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              School Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Updating...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
