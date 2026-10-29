import { useState, useMemo } from 'react';
import {
  Search, Filter, X, Package, TrendingDown, Wrench,
  Building2, MapPin, CheckCircle2, AlertCircle,
  BarChart3, Download, ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react';

// ─── tiny helpers ───────────────────────────────────────────────
const CATEGORIES  = ['All', 'Computers', 'Furniture', 'Laboratory Equipment', 'Books', 'Sports Equipment', 'Other'];
const CONDITIONS  = ['All', 'Unused', 'In Use', 'Underutilized', 'Needs Repair', 'Repaired'];
const LIFECYCLES  = ['All', 'Available', 'In Use', 'Underutilized', 'Needs Repair', 'Repaired'];
const URGENCIES   = ['All', 'Critical', 'High', 'Medium', 'Low'];
const REQ_STATUSES = ['All', 'Pending', 'Submitted', 'Under Review', 'Approved', 'Rejected'];

function Badge({ children, color = 'slate' }) {
  const map = {
    slate:   'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-800',
    rose:    'bg-rose-100 text-rose-800',
    amber:   'bg-amber-100 text-amber-800',
    orange:  'bg-orange-100 text-orange-800',
    blue:    'bg-blue-100 text-blue-800',
    red:     'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[color] || map.slate}`}>
      {children}
    </span>
  );
}

// ─── Summary stat card ───────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color = 'slate' }) {
  const colors = {
    slate:   'bg-white border-slate-200 text-slate-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    rose:    'bg-rose-50 border-rose-200 text-rose-700',
    amber:   'bg-amber-50 border-amber-200 text-amber-700',
    blue:    'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <div className={`p-4 rounded-xl border shadow-xs ${colors[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold opacity-70">{label}</span>
        {Icon && <Icon className="w-4 h-4 opacity-60" />}
      </div>
      <div className="text-2xl font-black">{value}</div>
      {sub && <div className="text-[11px] opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────
export default function ReportsTab({ schools, resources, requirements, allocations, decisions }) {
  // ── Filter state ──
  const [search, setSearch]         = useState('');
  const [filterSchool, setFilterSchool] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterCondition, setFilterCondition] = useState('All');
  const [filterLifecycle, setFilterLifecycle] = useState('All');
  const [filterUrgency, setFilterUrgency]   = useState('All');
  const [filterReqStatus, setFilterReqStatus] = useState('All');
  const [activeSection, setActiveSection]   = useState('resources'); // 'resources' | 'requirements' | 'decisions'
  const [showFilters, setShowFilters]       = useState(true);

  const schoolOptions = ['All', ...schools.map(s => s.schoolName)];

  // ── Filtered resources ──
  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const schoolName = r.schoolId?.schoolName || '';
      if (filterSchool !== 'All' && schoolName !== filterSchool) return false;
      if (filterCategory !== 'All' && r.category !== filterCategory) return false;
      if (filterCondition !== 'All' && r.condition !== filterCondition) return false;
      if (filterLifecycle !== 'All' && r.lifecycleStatus !== filterLifecycle) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.resourceName?.toLowerCase().includes(q) &&
            !schoolName.toLowerCase().includes(q) &&
            !r.category?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [resources, filterSchool, filterCategory, filterCondition, filterLifecycle, search]);

  // ── Filtered requirements ──
  const filteredRequirements = useMemo(() => {
    return requirements.filter(r => {
      const schoolName = r.schoolId?.schoolName || '';
      if (filterSchool !== 'All' && schoolName !== filterSchool) return false;
      if (filterCategory !== 'All' && r.category !== filterCategory) return false;
      if (filterUrgency !== 'All' && r.urgency !== filterUrgency) return false;
      if (filterReqStatus !== 'All' && r.status !== filterReqStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.resourceName?.toLowerCase().includes(q) &&
            !schoolName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [requirements, filterSchool, filterCategory, filterUrgency, filterReqStatus, search]);

  // ── Summary numbers ──
  const totalUnused    = resources.reduce((s, r) => s + (r.unusedQuantity || 0), 0);
  const totalInUse     = resources.reduce((s, r) => s + (r.inUseQuantity || 0), 0);
  const totalNeedRepair = resources.filter(r => r.condition === 'Needs Repair').length;
  const totalShortage  = requirements.reduce((s, r) => s + (r.shortageQuantity || 0), 0);
  const pendingReqs    = requirements.filter(r => r.status === 'Pending' || r.status === 'Submitted').length;
  const approvedReqs   = requirements.filter(r => r.status === 'Approved').length;

  const clearFilters = () => {
    setSearch(''); setFilterSchool('All'); setFilterCategory('All');
    setFilterCondition('All'); setFilterLifecycle('All');
    setFilterUrgency('All'); setFilterReqStatus('All');
  };
  const hasActiveFilters = search || filterSchool !== 'All' || filterCategory !== 'All' ||
    filterCondition !== 'All' || filterLifecycle !== 'All' ||
    filterUrgency !== 'All' || filterReqStatus !== 'All';

  // ── Per-school summary for report ──
  const schoolSummary = schools.map(school => {
    const sid = school._id;
    const sr = resources.filter(r => (r.schoolId?._id || r.schoolId) === sid);
    const sq = requirements.filter(r => (r.schoolId?._id || r.schoolId) === sid);
    return {
      ...school,
      resourceCount: sr.length,
      unusedCount:   sr.reduce((s, r) => s + (r.unusedQuantity || 0), 0),
      repairCount:   sr.filter(r => r.condition === 'Needs Repair').length,
      shortageCount: sq.reduce((s, r) => s + (r.shortageQuantity || 0), 0),
      pendingCount:  sq.filter(r => r.status === 'Pending' || r.status === 'Submitted').length,
    };
  });

  return (
    <div className="space-y-5">

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Schools"    value={schools.length}     icon={Building2}   color="blue" />
        <StatCard label="Total Resources"  value={resources.length}   icon={Package}     color="slate" />
        <StatCard label="Unused Surplus"   value={totalUnused}        icon={CheckCircle2} color="emerald"
                  sub={`${totalInUse} in use`} />
        <StatCard label="Need Repair"      value={totalNeedRepair}    icon={Wrench}      color="amber" />
        <StatCard label="Total Shortage"   value={totalShortage + ' units'} icon={TrendingDown} color="rose" />
        <StatCard label="Pending Requests" value={pendingReqs}        icon={AlertCircle} color="rose"
                  sub={`${approvedReqs} approved`} />
      </div>

      {/* ── School-wise Summary Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold text-slate-900">School-wise Resource Summary</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3 font-semibold">School</th>
                <th className="p-3 font-semibold">District</th>
                <th className="p-3 font-semibold text-center">Resources</th>
                <th className="p-3 font-semibold text-center text-emerald-700">Unused Surplus</th>
                <th className="p-3 font-semibold text-center text-orange-700">Need Repair</th>
                <th className="p-3 font-semibold text-center text-rose-700">Shortage Units</th>
                <th className="p-3 font-semibold text-center">Pending Reqs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schoolSummary.map(s => (
                <tr key={s._id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 font-semibold text-slate-900">
                    <div>{s.schoolName.split(',')[0]}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{s.schoolCode}</div>
                  </td>
                  <td className="p-3 text-slate-600">{s.district}</td>
                  <td className="p-3 text-center font-bold text-slate-800">{s.resourceCount}</td>
                  <td className="p-3 text-center">
                    <span className={`font-bold ${s.unusedCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.unusedCount}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-bold ${s.repairCount > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                      {s.repairCount}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-extrabold ${s.shortageCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {s.shortageCount > 0 ? `-${s.shortageCount}` : '0'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {s.pendingCount > 0
                      ? <Badge color="amber">{s.pendingCount} pending</Badge>
                      : <Badge color="emerald">Clear</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Search & Filter Panel ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div
          className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition"
          onClick={() => setShowFilters(v => !v)}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">Search &amp; Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">Active</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={e => { e.stopPropagation(); clearFilters(); }}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
            {showFilters ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {showFilters && (
          <div className="p-4 space-y-3">
            {/* Global search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by resource name, school, or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { label: 'School',    value: filterSchool,    setter: setFilterSchool,    options: schoolOptions },
                { label: 'Category',  value: filterCategory,  setter: setFilterCategory,  options: CATEGORIES },
                { label: 'Condition', value: filterCondition, setter: setFilterCondition, options: CONDITIONS },
                { label: 'Lifecycle', value: filterLifecycle, setter: setFilterLifecycle, options: LIFECYCLES },
                { label: 'Urgency',   value: filterUrgency,   setter: setFilterUrgency,   options: URGENCIES },
                { label: 'Req. Status', value: filterReqStatus, setter: setFilterReqStatus, options: REQ_STATUSES },
              ].map(({ label, value, setter, options }) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                  <select
                    value={value}
                    onChange={e => setter(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Result Tabs ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Sub-tab nav */}
        <div className="border-b border-slate-200 flex gap-0 overflow-x-auto">
          {[
            { id: 'resources',    label: `Resources (${filteredResources.length})`,     icon: Package },
            { id: 'requirements', label: `Requirements (${filteredRequirements.length})`, icon: TrendingDown },
            { id: 'decisions',   label: `Decision Log (${decisions.length})`,            icon: CheckCircle2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`px-4 py-3 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
                activeSection === id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Resources table ── */}
        {activeSection === 'resources' && (
          filteredResources.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No resources match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-3 font-semibold">Resource</th>
                    <th className="p-3 font-semibold">School</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold text-center">Total</th>
                    <th className="p-3 font-semibold text-center text-blue-700">In Use</th>
                    <th className="p-3 font-semibold text-center text-emerald-700">Unused</th>
                    <th className="p-3 font-semibold">Condition</th>
                    <th className="p-3 font-semibold">Lifecycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResources.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-slate-900">
                        {r.resourceName}
                        <div className="text-[10px] text-slate-400 font-normal">{r.schoolLocation} · {r.purchaseYear}</div>
                      </td>
                      <td className="p-3 text-slate-700">{r.schoolId?.schoolName?.split(',')[0]}</td>
                      <td className="p-3 text-slate-600">{r.category}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{r.totalQuantity}</td>
                      <td className="p-3 text-center text-blue-700 font-medium">{r.inUseQuantity}</td>
                      <td className="p-3 text-center font-bold text-emerald-600">{r.unusedQuantity}</td>
                      <td className="p-3">
                        <Badge color={
                          r.condition === 'Unused'       ? 'emerald' :
                          r.condition === 'In Use'       ? 'blue' :
                          r.condition === 'Underutilized'? 'amber' :
                          r.condition === 'Needs Repair' ? 'orange' : 'slate'
                        }>{r.condition}</Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {r.lifecycleStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── Requirements table ── */}
        {activeSection === 'requirements' && (
          filteredRequirements.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <TrendingDown className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No requirements match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-3 font-semibold">School</th>
                    <th className="p-3 font-semibold">Resource</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold text-center">Required</th>
                    <th className="p-3 font-semibold text-center">Available</th>
                    <th className="p-3 font-semibold text-center text-rose-700">Shortage</th>
                    <th className="p-3 font-semibold">Urgency</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequirements.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-slate-900">
                        {r.schoolId?.schoolName?.split(',')[0]}
                        <div className="text-[10px] text-slate-400 font-normal">{r.schoolId?.district}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{r.resourceName}</td>
                      <td className="p-3 text-slate-600">{r.category}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{r.requiredQuantity}</td>
                      <td className="p-3 text-center text-slate-600">{r.availableQuantity}</td>
                      <td className="p-3 text-center">
                        {r.shortageQuantity > 0
                          ? <span className="font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">-{r.shortageQuantity}</span>
                          : <span className="text-emerald-600 font-bold">OK</span>}
                      </td>
                      <td className="p-3">
                        <Badge color={r.urgency === 'Critical' ? 'red' : r.urgency === 'High' ? 'orange' : r.urgency === 'Medium' ? 'amber' : 'slate'}>
                          {r.urgency}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge color={r.status === 'Approved' ? 'emerald' : r.status === 'Rejected' ? 'rose' : r.status === 'Under Review' ? 'blue' : 'amber'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate" title={r.reason}>{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── Decision Log ── */}
        {activeSection === 'decisions' && (
          decisions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No officer decisions recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {decisions.map(d => (
                <div key={d._id} className="p-4 hover:bg-slate-50/60">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${d.decisionType?.includes('Rejected') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {d.decisionType?.includes('Rejected')
                          ? <X className="w-4 h-4" />
                          : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{d.resourceName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          School: <strong className="text-slate-700">{d.recipientSchoolId?.schoolName?.split(',')[0] || 'N/A'}</strong>
                          {' · '}Officer: <strong className="text-slate-700">{d.officerName}</strong>
                        </div>
                        <div className="text-xs text-slate-600 mt-1.5 bg-slate-50 border border-slate-200 p-2 rounded-lg italic max-w-lg">
                          "{d.commentReason}"
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge color={d.decisionType?.includes('Rejected') ? 'rose' : 'emerald'}>
                        {d.decisionType}
                      </Badge>
                      {d.estimatedCost > 0 && (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          ₹{d.estimatedCost?.toLocaleString()}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(d.decidedAt || d.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
