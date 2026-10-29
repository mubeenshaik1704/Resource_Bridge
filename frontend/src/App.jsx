import { useState, useEffect } from 'react';
import { 
  checkSystemHealth, 
  fetchStats, 
  fetchSchools, 
  fetchResources, 
  fetchRequirements, 
  fetchAllocations,
  fetchDecisions,
  logoutUser,
  deleteResource,
  updateResourceLifecycle,
  deleteRequirement,
  triggerAllocationScan 
} from './services/api';
import AuthModal from './components/AuthModal';
import ResourceModal from './components/ResourceModal';
import SchoolProfileModal from './components/SchoolProfileModal';
import RequirementModal from './components/RequirementModal';
import DecisionModal from './components/DecisionModal';
import LoginPage from './components/LoginPage';
import SchoolMap from './components/SchoolMap';
import ReportsTab from './components/ReportsTab';
import AIAssistant from './components/AIAssistant';
import { 
  Building2, 
  ShieldCheck, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  Layers,
  ArrowRight,
  TrendingDown,
  Wrench,
  Package,
  Clock,
  MapPin,
  ExternalLink,
  DollarSign,
  User,
  LogOut,
  LogIn,
  SlidersHorizontal,
  ChevronRight,
  School as SchoolIcon,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  ClipboardList,
  XCircle,
  History,
  Gavel,
  BarChart3,
  Map
} from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('resource_bridge_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState(null);
  const [selectedSchoolForResource, setSelectedSchoolForResource] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [selectedAllocationForDecision, setSelectedAllocationForDecision] = useState(null);

  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [schools, setSchools] = useState([]);
  const [resources, setResources] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isScanning, setIsScanning] = useState(false);

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      await triggerAllocationScan();
      await loadAllData();
      alert('Non-AI potential allocation scan completed! Identified recommendations updated.');
    } catch (err) {
      alert('Error scanning allocations: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, statsData, schoolsData, resourcesData, requirementsData, allocationsData, decisionsData] = await Promise.all([
        checkSystemHealth(),
        fetchStats(),
        fetchSchools(),
        fetchResources(),
        fetchRequirements(),
        fetchAllocations(),
        fetchDecisions()
      ]);
      setHealth(healthData);
      setStats(statsData);
      setSchools(schoolsData);
      setResources(resourcesData);
      setRequirements(requirementsData);
      setAllocations(allocationsData);
      setDecisions(decisionsData);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setStats(null);
    setSchools([]);
    setResources([]);
    setRequirements([]);
    setAllocations([]);
    setDecisions([]);
    setActiveTab('overview');
  };

  const handleLoginSuccess = (user) => {
    if (!user) {
    console.error('Login failed: user data is missing');
    return;
    }
    setCurrentUser(user);
    // Auto-navigate to the most useful tab for each role
    if (user.role === 'OFFICER') {
      setActiveTab('officer');
    } else if (user.role === 'SCHOOL') {
      setActiveTab('myschool');
    }
    loadAllData();
  };

  // Open modal to add resource
  const handleOpenAddResource = (schoolId) => {
    setResourceToEdit(null);
    setSelectedSchoolForResource(schoolId);
    setIsResourceModalOpen(true);
  };

  // Open modal to edit resource
  const handleOpenEditResource = (resource) => {
    setResourceToEdit(resource);
    setSelectedSchoolForResource(resource.schoolId?._id || resource.schoolId);
    setIsResourceModalOpen(true);
  };

  // Delete resource
  const handleDeleteResource = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete '${name}' from inventory?`)) return;
    try {
      await deleteResource(id);
      loadAllData();
    } catch (err) {
      alert('Failed to delete resource: ' + err.message);
    }
  };

  // Quick lifecycle update
  const handleUpdateLifecycle = async (id, nextStage) => {
    try {
      await updateResourceLifecycle(id, { lifecycleStatus: nextStage });
      loadAllData();
    } catch (err) {
      alert('Failed to update lifecycle: ' + err.message);
    }
  };

  // Update school profile success
  const handleProfileUpdateSuccess = (updatedSchool) => {
    if (currentUser?.school?._id === updatedSchool._id) {
      const updatedUser = { ...currentUser, school: updatedSchool };
      setCurrentUser(updatedUser);
      localStorage.setItem('resource_bridge_user', JSON.stringify(updatedUser));
    }
    loadAllData();
  };

  // Delete requirement
  const handleDeleteRequirement = async (id, name) => {
    if (!window.confirm(`Are you sure you want to withdraw the requirement for '${name}'?`)) return;
    try {
      await deleteRequirement(id);
      loadAllData();
    } catch (err) {
      alert('Failed to delete requirement: ' + err.message);
    }
  };

  // Filter resources for logged in school if applicable
  const currentSchoolResources = currentUser?.role === 'SCHOOL' && currentUser.school
    ? resources.filter(r => (r.schoolId?._id || r.schoolId) === currentUser.school._id)
    : [];

  const currentSchoolRequirements = currentUser?.role === 'SCHOOL' && currentUser.school
    ? requirements.filter(r => (r.schoolId?._id || r.schoolId) === currentUser.school._id)
    : [];

  const phases = [
    { number: '1', title: 'Foundation Architecture', status: 'COMPLETED', desc: 'Node.js Express, MongoDB Mongoose, React 19, Tailwind CSS, live connectivity' },
    { number: '2', title: 'Data Models & Realistic Seed Data', status: 'COMPLETED', desc: 'Mongoose schemas for Users, Schools, Resources, Shortages & Allocations with seed data' },
    { number: '3', title: 'School & Officer Authentication', status: 'COMPLETED', desc: 'Role-based portals with secure session management for School Admins and Officers' },
    { number: '4', title: 'School Resource Inventory & Lifecycle', status: 'COMPLETED', desc: 'Add/Edit resources, In Use/Unused/Repair condition & lifecycle transitions' },
    { number: '5', title: 'Requirements & Non-AI Shortage Detection', status: 'COMPLETED', desc: 'Pure business logic: Shortage = Required - Available' },
    { number: '6', title: 'Potential Allocation Recommendation Engine', status: 'COMPLETED', desc: 'Identify surplus donor schools, distance & transport calculation' },
    { number: '7', title: '3-Way Cost Comparison & Officer Decision', status: 'COMPLETED', desc: 'Side-by-side: Repair vs Reallocation vs New Procurement with Officer Approvals & Audit Log' },
    { number: '8', title: 'Interactive Map, Search/Filters & Official Reports', status: 'COMPLETED', desc: 'School GIS map (Leaflet.js), multi-criteria search/filter panel, school-wise summary reports' }
  ];

  // ── Gate: show Login Page when not authenticated ──
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Official Government Top Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  Government of Education
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">Department Portal</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Resource Bridge
                <span className="text-xs font-normal text-slate-400 hidden md:inline">| Resource Allocation & Management</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User Profile / Login Button */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 py-1 px-2.5 rounded-lg text-xs">
                <div className={`p-1 rounded-full ${currentUser.role === 'OFFICER' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {currentUser.role === 'OFFICER' ? <ShieldCheck className="w-3.5 h-3.5" /> : <SchoolIcon className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-white leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {currentUser.role === 'OFFICER' ? 'Department Officer' : currentUser.school?.schoolName || 'School Admin'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="ml-1 text-slate-400 hover:text-rose-400 transition p-1 hover:bg-slate-700 rounded"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-1.5 rounded-lg font-semibold transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Demo Login</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={loadAllData}
              disabled={loading}
              title="Refresh Data"
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Core Government Policy Banner */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-xs flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <strong className="font-semibold text-amber-950">Statutory System Policy:</strong>{' '}
            Resource Bridge <span className="underline decoration-amber-400 font-medium">does not automatically transfer</span> government-owned resources between schools.
            The system provides data-driven allocation recommendations. The authorized Education Department officer makes all final decisions.
          </div>
        </div>

        {/* Personalized Logged In Role Banner */}
        {currentUser && (
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            currentUser.role === 'OFFICER' 
              ? 'bg-blue-50/70 border-blue-200' 
              : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${
                currentUser.role === 'OFFICER' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {currentUser.role === 'OFFICER' ? <ShieldCheck className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    currentUser.role === 'OFFICER' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {currentUser.role === 'OFFICER' ? 'Officer Portal Active' : 'School Portal Active'}
                  </span>
                  <span className="text-xs text-slate-500">Authenticated Session</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Welcome, {currentUser.name}
                </h2>
                {currentUser.school && (
                  <p className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>Code: <strong className="text-slate-800">{currentUser.school.schoolCode}</strong></span>
                    <span>•</span>
                    <span>District: <strong className="text-slate-800">{currentUser.school.district}</strong></span>
                    <span>•</span>
                    <span>Students: <strong className="text-slate-800">{currentUser.school.studentCount}</strong></span>
                    <span>•</span>
                    <span>Classrooms: <strong className="text-slate-800">{currentUser.school.classroomCount}</strong></span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {currentUser.role === 'SCHOOL' && (
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Edit School Info</span>
                </button>
              )}

              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Switch User</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Department Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium flex items-center justify-between">
                Total Schools
                <Building2 className="w-4 h-4 text-blue-500" />
              </span>
              <div className="text-2xl font-bold text-slate-800 mt-1">{stats.totalSchools}</div>
              <span className="text-[11px] text-slate-400">Registered schools</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium flex items-center justify-between">
                Total Resources
                <Package className="w-4 h-4 text-slate-500" />
              </span>
              <div className="text-2xl font-bold text-slate-800 mt-1">{stats.totalResources}</div>
              <span className="text-[11px] text-slate-400">Inventory units</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium flex items-center justify-between">
                Unused Surplus
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.unusedResources}</div>
              <span className="text-[11px] text-emerald-600 font-medium">Surplus available</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium flex items-center justify-between">
                Underutilized
                <TrendingDown className="w-4 h-4 text-amber-500" />
              </span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{stats.underutilizedResources}</div>
              <span className="text-[11px] text-amber-600 font-medium">Low usage rate</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium flex items-center justify-between">
                Needing Repair
                <Wrench className="w-4 h-4 text-orange-500" />
              </span>
              <div className="text-2xl font-bold text-orange-600 mt-1">{stats.resourcesNeedingRepair}</div>
              <span className="text-[11px] text-orange-600 font-medium">Repairable units</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium flex items-center justify-between">
                Shortage Schools
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </span>
              <div className="text-2xl font-bold text-rose-600 mt-1">{stats.schoolsWithShortages}</div>
              <span className="text-[11px] text-rose-600 font-medium">{stats.pendingRequests} pending requests</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 space-x-4 overflow-x-auto">
          {currentUser?.role === 'SCHOOL' ? (
            <button
              onClick={() => setActiveTab('myschool')}
              className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'myschool'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              My School Inventory ({currentSchoolResources.length})
            </button>
          ) : null}

          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Live Example Scenario (School A & B)
          </button>

          <button
            onClick={() => setActiveTab('schools')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'schools'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <SchoolIcon className="w-4 h-4" />
            Registered Schools ({schools.length})
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'resources'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-4 h-4" />
            All Resources Inventory ({resources.length})
          </button>

          <button
            onClick={() => setActiveTab('allocations')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'allocations'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowRight className="w-4 h-4 text-indigo-600" />
            Potential Allocations ({allocations.length})
          </button>

          {currentUser?.role === 'OFFICER' && (
            <button
              onClick={() => setActiveTab('officer')}
              className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'officer'
                  ? 'border-blue-700 text-blue-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Gavel className="w-4 h-4 text-blue-700" />
              Officer Dashboard
              {requirements.filter(r => r.status === 'Pending').length > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {requirements.filter(r => r.status === 'Pending').length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('map')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'map'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Map className="w-4 h-4 text-emerald-600" />
            School Map
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-purple-600" />
            Reports &amp; Search
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Implementation Roadmap
          </button>
        </div>

        {/* Tab: My School Inventory (Step 4 Focus) */}
        {activeTab === 'myschool' && currentUser?.role === 'SCHOOL' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    School Resource Management
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{currentUser.school?.schoolCode}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {currentUser.school?.schoolName}
                </h3>
                <p className="text-xs text-slate-500">
                  Principal: {currentUser.school?.principalName} • Phone: {currentUser.school?.contactNumber} • District: {currentUser.school?.district}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Students & Classrooms</span>
                </button>

                <button
                  onClick={() => handleOpenAddResource(currentUser.school?._id)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Resource</span>
                </button>
              </div>
            </div>

            {/* School Profile Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium">Students Enrolled</span>
                <div className="text-xl font-bold text-slate-900">{currentUser.school?.studentCount}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium">Classrooms</span>
                <div className="text-xl font-bold text-slate-900">{currentUser.school?.classroomCount}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium">Inventory Types</span>
                <div className="text-xl font-bold text-blue-600">{currentSchoolResources.length} Items</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium">Unused Surplus</span>
                <div className="text-xl font-bold text-emerald-600">
                  {currentSchoolResources.reduce((acc, r) => acc + (r.unusedQuantity || 0), 0)} Units
                </div>
              </div>
            </div>

            {/* Resources Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Resource Inventory & Lifecycle Stages
                </h4>
                <span className="text-[11px] text-slate-400">
                  Available → In Use → Underutilized → Needs Repair → Repaired
                </span>
              </div>

              {currentSchoolResources.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No resources logged yet for this school.</p>
                  <p>Click the "Add New Resource" button above to record your computers, furniture, lab kits, or books.</p>
                  <button
                    onClick={() => handleOpenAddResource(currentUser.school?._id)}
                    className="mt-2 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold"
                  >
                    + Add First Resource
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-semibold">Resource Details</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold text-center">Total</th>
                        <th className="p-3 font-semibold text-center">In Use</th>
                        <th className="p-3 font-semibold text-center text-emerald-700">Unused</th>
                        <th className="p-3 font-semibold">Condition</th>
                        <th className="p-3 font-semibold">Lifecycle Stage</th>
                        <th className="p-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentSchoolResources.map((res) => (
                        <tr key={res._id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 font-semibold text-slate-900">
                            <div>{res.resourceName}</div>
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                              📍 {res.schoolLocation} • Year: {res.purchaseYear} • Notes: {res.maintenanceStatus}
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">{res.category}</td>
                          <td className="p-3 text-center font-bold text-slate-800">{res.totalQuantity}</td>
                          <td className="p-3 text-center text-slate-700 font-medium">{res.inUseQuantity}</td>
                          <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/50">
                            {res.unusedQuantity}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              res.condition === 'In Use' ? 'bg-blue-100 text-blue-800' :
                              res.condition === 'Unused' ? 'bg-emerald-100 text-emerald-800' :
                              res.condition === 'Underutilized' ? 'bg-amber-100 text-amber-800' :
                              res.condition === 'Needs Repair' ? 'bg-orange-100 text-orange-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {res.condition}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-slate-800 text-[11px]">
                                {res.lifecycleStatus}
                              </span>
                              {/* Quick Transition Selector */}
                              <select
                                value={res.lifecycleStatus}
                                onChange={(e) => handleUpdateLifecycle(res._id, e.target.value)}
                                className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-hidden"
                              >
                                <option value="Available">Set: Available</option>
                                <option value="In Use">Set: In Use</option>
                                <option value="Underutilized">Set: Underutilized</option>
                                <option value="Needs Repair">Set: Needs Repair</option>
                                <option value="Repaired">Set: Repaired</option>
                              </select>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenEditResource(res)}
                                title="Edit Resource"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteResource(res._id, res.resourceName)}
                                title="Delete Resource"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* School Requirements & Shortages Section */}
            <div className="pt-5 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
                      Shortage Tracking
                    </span>
                    <span className="text-xs text-slate-500">Pure Business Logic (No AI)</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    Submitted Resource Requirements & Detected Shortages
                  </h4>
                  <p className="text-xs text-slate-500">
                    Formula: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">Shortage = Required Quantity - Available Inventory</code>
                  </p>
                </div>

                <button
                  onClick={() => setIsRequirementModalOpen(true)}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Request Resource / Report Shortage</span>
                </button>
              </div>

              {currentSchoolRequirements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="font-semibold text-slate-600">No resource requirements submitted by this school yet.</p>
                  <p className="mt-1">If your school has a shortage of computers, projectors, lab kits, or furniture, click above to submit a request.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-semibold">Required Resource</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold text-center">Required</th>
                        <th className="p-3 font-semibold text-center">Available</th>
                        <th className="p-3 font-semibold text-center">Calculated Shortage</th>
                        <th className="p-3 font-semibold">Urgency</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">Reason</th>
                        <th className="p-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentSchoolRequirements.map((req) => (
                        <tr key={req._id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 font-semibold text-slate-900">{req.resourceName}</td>
                          <td className="p-3 text-slate-600">{req.category}</td>
                          <td className="p-3 text-center font-bold text-slate-800">{req.requiredQuantity}</td>
                          <td className="p-3 text-center text-slate-700">{req.availableQuantity}</td>
                          <td className="p-3 text-center">
                            {req.shortageQuantity > 0 ? (
                              <span className="font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-xs">
                                Shortage: {req.shortageQuantity}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-xs">
                                No Shortage
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                              req.urgency === 'High' ? 'bg-orange-100 text-orange-800' :
                              req.urgency === 'Medium' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {req.urgency}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                              req.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                              req.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 max-w-xs truncate" title={req.reason}>
                            {req.reason}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteRequirement(req._id, req.resourceName)}
                              title="Withdraw Requirement"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Live Scenario Preview (Direct Example from Prompt) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* School A Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                      School A (Potential Donor)
                    </span>
                    <span className="text-xs text-slate-400">SCH-001</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">South District</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  Government Model Senior Secondary School, Sector 4
                </h3>
                <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-950">
                  <div className="font-bold text-emerald-800 text-sm">Computers Inventory:</div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div className="bg-white p-2 rounded border border-emerald-100">
                      <div className="text-slate-400">Total</div>
                      <div className="text-base font-bold text-slate-800">20</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-emerald-100">
                      <div className="text-slate-400">In Use</div>
                      <div className="text-base font-bold text-slate-800">12</div>
                    </div>
                    <div className="bg-emerald-600 text-white p-2 rounded shadow-xs">
                      <div className="text-emerald-100">Unused Surplus</div>
                      <div className="text-base font-bold">8</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-emerald-700">
                    Condition: 6 in good condition, 2 minor servicing required.
                  </div>
                </div>
              </div>

              {/* School B Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
                      School B (Shortage School)
                    </span>
                    <span className="text-xs text-slate-400">SCH-002</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">Central District</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  Government Boys High School, Gandhi Nagar
                </h3>
                <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-950">
                  <div className="font-bold text-rose-800 text-sm">Computer Shortage Calculation (Pure Logic):</div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div className="bg-white p-2 rounded border border-rose-100">
                      <div className="text-slate-400">Required</div>
                      <div className="text-base font-bold text-slate-800">20</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-rose-100">
                      <div className="text-slate-400">Available</div>
                      <div className="text-base font-bold text-slate-800">5</div>
                    </div>
                    <div className="bg-rose-600 text-white p-2 rounded shadow-xs">
                      <div className="text-rose-100">Shortage</div>
                      <div className="text-base font-bold">15</div>
                    </div>
                  </div>
                  <div className="mt-2 font-bold text-rose-700">
                    Computer Shortage: 15 (Calculated via 20 - 5, No AI)
                  </div>
                </div>
              </div>
            </div>

            {/* Potential Allocation Recommendation Banner */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-xs p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded">
                    Potential Allocation Recommendation
                  </span>
                  <span className="text-xs text-slate-500">Non-AI Rule Engine</span>
                </div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                  Recommendation Only • No Auto Transfer
                </span>
              </div>

              <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-center md:text-left">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Donor School</div>
                  <div className="font-bold text-slate-800">School A (Sector 4)</div>
                  <div className="text-xs text-emerald-600 font-medium">8 unused computers available</div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mb-1">
                    13.1 km distance
                  </div>
                  <div className="flex items-center text-blue-600 font-bold">
                    <span>Transfer 8 units</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Recipient School</div>
                  <div className="font-bold text-slate-800">School B (Gandhi Nagar)</div>
                  <div className="text-xs text-rose-600 font-medium">Needs 15 computers (Shortage: 15)</div>
                </div>
              </div>

              {/* 3-Way Cost Comparison Preview */}
              <div className="mt-5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Officer Cost Comparison Options:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500">Option 1: Repair Existing</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">₹2,500</div>
                    <div className="text-[11px] text-slate-500">Local IT servicing & parts</div>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 ring-1 ring-blue-300">
                    <div className="text-xs text-blue-700 font-semibold">Option 2: Reallocation Transport</div>
                    <div className="text-lg font-bold text-blue-900 mt-0.5">₹4,000</div>
                    <div className="text-[11px] text-blue-600 font-medium">Estimated 13.1 km freight from School A</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500">Option 3: New Procurement</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">₹2,40,000</div>
                    <div className="text-[11px] text-slate-500">8 new units @ ₹30,000 each</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Schools List */}
        {activeTab === 'schools' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registered Government Schools in MongoDB</h3>
                <p className="text-xs text-slate-500">Loaded directly from MongoDB collection 'schools'</p>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1"
              >
                <span>+ Register New School</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {schools.map((school) => (
                <div key={school._id} className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {school.schoolCode}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{school.schoolName}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {school.district} • {school.address}
                      </span>
                      <span>Principal: {school.principalName}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs shrink-0">
                    <div className="text-center bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                      <div className="text-slate-400 font-medium">Students</div>
                      <div className="font-bold text-slate-800">{school.studentCount}</div>
                    </div>
                    <div className="text-center bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                      <div className="text-slate-400 font-medium">Classrooms</div>
                      <div className="font-bold text-slate-800">{school.classroomCount}</div>
                    </div>
                    <button
                      onClick={() => handleOpenAddResource(school._id)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold border border-blue-200 transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Resource</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: All Resources Inventory */}
        {activeTab === 'resources' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">All Registered Government School Resources</h3>
                <p className="text-xs text-slate-500">Tracking Total, In Use, Unused, and Condition Status</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                {resources.length} Resource Entries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-semibold">Resource Name</th>
                    <th className="p-3 font-semibold">School</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold text-center">Total</th>
                    <th className="p-3 font-semibold text-center">In Use</th>
                    <th className="p-3 font-semibold text-center">Unused</th>
                    <th className="p-3 font-semibold">Condition</th>
                    <th className="p-3 font-semibold">Lifecycle</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((res) => (
                    <tr key={res._id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">
                        {res.resourceName}
                        <div className="text-[10px] text-slate-400 font-normal">{res.schoolLocation} • Year {res.purchaseYear}</div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{res.schoolId?.schoolName}</td>
                      <td className="p-3 text-slate-600">{res.category}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{res.totalQuantity}</td>
                      <td className="p-3 text-center text-slate-700">{res.inUseQuantity}</td>
                      <td className="p-3 text-center font-bold text-emerald-600">{res.unusedQuantity}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          res.condition === 'In Use' ? 'bg-blue-100 text-blue-800' :
                          res.condition === 'Unused' ? 'bg-emerald-100 text-emerald-800' :
                          res.condition === 'Underutilized' ? 'bg-amber-100 text-amber-800' :
                          res.condition === 'Needs Repair' ? 'bg-orange-100 text-orange-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {res.condition}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {res.lifecycleStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditResource(res)}
                            title="Edit Resource"
                            className="p-1 text-slate-500 hover:text-blue-600 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(res._id, res.resourceName)}
                            title="Delete Resource"
                            className="p-1 text-slate-500 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Potential Allocations (Step 6 Focus) */}
        {activeTab === 'allocations' && (
          <div className="space-y-5">
            {/* Action Bar & Statutory Rule Header */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    Potential Resource Allocation Engine
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">Non-AI Rule Algorithm</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Cross-School Resource Reallocation Recommendations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Matches schools having resource shortages with other schools holding unused surplus in the same category.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleTriggerScan}
                  disabled={isScanning}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning Surplus...' : 'Run Allocation Scan'}</span>
                </button>
              </div>
            </div>

            {/* Statutory Reminder Card */}
            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 flex items-start space-x-3 text-amber-900 text-xs">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-950">Statutory System Policy:</strong>{' '}
                Resource Bridge <span className="underline decoration-amber-500 font-bold">does NOT automatically transfer</span> government-owned resources between schools.
                The options below are system-identified recommendations. The authorized Education Department Officer makes the final decision according to appropriate government procedures.
              </div>
            </div>

            {/* List of Potential Allocations */}
            {allocations.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No Potential Reallocations Identified Yet</p>
                <p>When schools report shortages and other schools log unused surplus, recommendations will automatically be identified here.</p>
                <button
                  onClick={handleTriggerScan}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Run Allocation Scan Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {allocations.map((alloc) => (
                  <div key={alloc._id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Header route */}
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {alloc.category}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{alloc.resourceName}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Recommendation Only • Officer Decision Required
                      </span>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Transfer Route Diagram */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                        {/* Donor School */}
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                            Donor School (Surplus)
                          </span>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">
                            {alloc.donorSchoolId?.schoolName}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            District: {alloc.donorSchoolId?.district} • Code: {alloc.donorSchoolId?.schoolCode}
                          </div>
                          <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block">
                            {alloc.availableQuantityAtDonor} unused surplus available
                          </div>
                        </div>

                        {/* Route & Distance Info */}
                        <div className="flex flex-col items-center justify-center text-center px-2 py-1">
                          <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full mb-1">
                            {alloc.distanceKm} km (Haversine distance)
                          </div>
                          <div className="flex items-center text-indigo-600 font-extrabold text-sm my-1">
                            <span>Reallocate {alloc.recommendedQuantity} Units</span>
                            <ArrowRight className="w-5 h-5 ml-1" />
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Estimated Transport: <strong className="text-slate-800">₹{alloc.estimatedTransportCost?.toLocaleString()}</strong>
                          </div>
                        </div>

                        {/* Recipient School */}
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs text-left md:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                            Recipient School (Shortage)
                          </span>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">
                            {alloc.recipientSchoolId?.schoolName}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            District: {alloc.recipientSchoolId?.district} • Code: {alloc.recipientSchoolId?.schoolCode}
                          </div>
                          <div className="mt-2 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded inline-block">
                            Needs {alloc.recommendedQuantity} units
                          </div>
                        </div>
                      </div>

                      {/* Resource Condition Notes */}
                      <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span><strong>Donor Condition:</strong> {alloc.donorResourceCondition}</span>
                        <span className="text-slate-400">Status: {alloc.status}</span>
                      </div>

                      {/* 3-Way Cost Comparison */}
                      <div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                          3-Way Cost Comparison for Officer Review:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Option 1: Repair */}
                          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-600">Option 1: Repair Existing</span>
                              <div className="text-xl font-black text-slate-900 mt-1">
                                ₹{alloc.estimatedRepairCost?.toLocaleString()}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Servicing existing worn units locally with spare parts.
                              </p>
                            </div>
                          </div>

                          {/* Option 2: Reallocation */}
                          <div className="p-3.5 bg-indigo-50/70 rounded-lg border border-indigo-200 ring-1 ring-indigo-300 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-700">Option 2: Reallocation</span>
                                <span className="text-[10px] font-bold uppercase bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                                  Recommended
                                </span>
                              </div>
                              <div className="text-xl font-black text-indigo-900 mt-1">
                                ₹{alloc.estimatedTransportCost?.toLocaleString()}
                              </div>
                              <p className="text-[11px] text-indigo-700 mt-1">
                                {alloc.distanceKm} km freight logistics from {alloc.donorSchoolId?.schoolName}.
                              </p>
                            </div>
                          </div>

                          {/* Option 3: Procurement */}
                          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
                            <div>
                              <span className="text-xs font-semibold text-slate-600">Option 3: New Procurement</span>
                              <div className="text-xl font-black text-slate-900 mt-1">
                                ₹{alloc.estimatedProcurementCost?.toLocaleString()}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Purchasing {alloc.recommendedQuantity} brand new market units.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Officer Decision Note */}
                      <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                        {alloc.officerRemarks}
                      </div>

                      {/* Officer: Review & Decide Button */}
                      {currentUser?.role === 'OFFICER' && alloc.status !== 'Approved' && alloc.status !== 'Rejected' && (
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setSelectedAllocationForDecision(alloc);
                              setIsDecisionModalOpen(true);
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-xs font-bold rounded-lg transition shadow-sm"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            Review & Record Official Decision
                          </button>
                        </div>
                      )}
                      {/* Show decision badge if already decided */}
                      {(alloc.status === 'Approved' || alloc.status === 'Rejected') && (
                        <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border ${
                          alloc.status === 'Approved'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}>
                          {alloc.status === 'Approved'
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            : <XCircle className="w-4 h-4 text-rose-600" />}
                          Officer Decision Recorded: {alloc.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Officer Dashboard (Step 7) */}
        {activeTab === 'officer' && currentUser?.role === 'OFFICER' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-xs p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Officer Decision Centre
                    </span>
                    <span className="text-xs text-slate-500">Education Department | Authorized Actions Only</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Welcome, {currentUser.name} — Officer Review Dashboard
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review pending resource requirements across all schools and record official decisions.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg">
                    <div className="text-xs text-rose-600 font-semibold">Pending</div>
                    <div className="text-xl font-black text-rose-700">
                      {requirements.filter(r => r.status === 'Pending').length}
                    </div>
                  </div>
                  <div className="text-center bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg">
                    <div className="text-xs text-emerald-600 font-semibold">Approved</div>
                    <div className="text-xl font-black text-emerald-700">
                      {requirements.filter(r => r.status === 'Approved').length}
                    </div>
                  </div>
                  <div className="text-center bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                    <div className="text-xs text-slate-500 font-semibold">Rejected</div>
                    <div className="text-xl font-black text-slate-700">
                      {requirements.filter(r => r.status === 'Rejected').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── AI Allocation Assistant (Decision-Support, Read-Only) ── */}
            <AIAssistant
              requirements={requirements}
              allocations={allocations}
              currentUser={currentUser}
            />

            {/* Pending Requirements Across All Schools */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-rose-600" />
                    All School Resource Requirements
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click "Record Decision" to approve or reject any pending requirement.
                  </p>
                </div>
              </div>

              {requirements.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No requirements submitted yet by any school.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-semibold">School</th>
                        <th className="p-3 font-semibold">Resource</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold text-center">Required</th>
                        <th className="p-3 font-semibold text-center">Available</th>
                        <th className="p-3 font-semibold text-center text-rose-700">Shortage</th>
                        <th className="p-3 font-semibold">Urgency</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requirements.map((req) => {
                        // Find matching allocation for this requirement
                        const matchingAlloc = allocations.find(
                          a => (a.requirementId?._id || a.requirementId) === req._id
                        );
                        return (
                          <tr key={req._id} className={`hover:bg-slate-50/70 transition ${req.status === 'Pending' ? '' : 'opacity-70'}`}>
                            <td className="p-3 font-semibold text-slate-900">
                              {req.schoolId?.schoolName || 'Unknown School'}
                              <div className="text-[10px] text-slate-400 font-normal">{req.schoolId?.district}</div>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{req.resourceName}</td>
                            <td className="p-3 text-slate-600">{req.category}</td>
                            <td className="p-3 text-center font-bold text-slate-800">{req.requiredQuantity}</td>
                            <td className="p-3 text-center text-slate-600">{req.availableQuantity}</td>
                            <td className="p-3 text-center">
                              {req.shortageQuantity > 0 ? (
                                <span className="font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                                  -{req.shortageQuantity}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">OK</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                req.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                                req.urgency === 'High' ? 'bg-orange-100 text-orange-800' :
                                req.urgency === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {req.urgency}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                req.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                                req.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {req.status === 'Pending' ? (
                                <button
                                  onClick={() => {
                                    setSelectedAllocationForDecision(matchingAlloc || { requirementId: req, resourceName: req.resourceName, recipientSchoolId: req.schoolId });
                                    setIsDecisionModalOpen(true);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold rounded-lg transition shadow-sm whitespace-nowrap"
                                >
                                  <Gavel className="w-3 h-3" />
                                  Record Decision
                                </button>
                              ) : (
                                <span className={`text-[10px] font-bold ${
                                  req.status === 'Approved' ? 'text-emerald-700' : 'text-rose-700'
                                }`}>
                                  {req.status === 'Approved' ? '✓ Approved' : '✗ Rejected'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Decision History Log */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Official Decision Audit Log</h4>
                  <p className="text-xs text-slate-500 mt-0.5">All recorded officer decisions with timestamps and reasons</p>
                </div>
              </div>

              {decisions.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400 space-y-2">
                  <History className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No decisions recorded yet.</p>
                  <p>Use the "Record Decision" buttons above to begin approving or rejecting requirements.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {decisions.map((dec) => (
                    <div key={dec._id} className="p-4 hover:bg-slate-50/60 transition">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            dec.decisionType?.includes('Rejected')
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {dec.decisionType?.includes('Rejected')
                              ? <XCircle className="w-4 h-4" />
                              : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{dec.resourceName || 'Resource'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              School: <strong className="text-slate-700">{dec.recipientSchoolId?.schoolName || 'N/A'}</strong>
                              {' · '}Officer: <strong className="text-slate-700">{dec.officerName}</strong>
                            </div>
                            <div className="text-xs text-slate-600 mt-1 bg-slate-50 border border-slate-200 p-2 rounded-lg italic max-w-xl">
                              "{dec.commentReason}"
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            dec.decisionType?.includes('Rejected')
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {dec.decisionType}
                          </span>
                          {dec.estimatedCost > 0 && (
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              ₹{dec.estimatedCost?.toLocaleString()}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(dec.decidedAt || dec.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: School Map (Step 8) */}
        {activeTab === 'map' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    GIS School Map
                  </span>
                  <span className="text-xs text-slate-500">OpenStreetMap · No API key needed</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Government Schools — Resource Status Map
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any school marker to see its resource summary. Colours show current status.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <SchoolMap
                schools={schools}
                resources={resources}
                requirements={requirements}
              />
            </div>
          </div>
        )}

        {/* Tab: Reports & Search (Step 8) */}
        {activeTab === 'reports' && (
          <div className="space-y-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-5 py-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                    Reports &amp; Search
                  </span>
                  <span className="text-xs text-slate-500">Filter across all schools and resources</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Department Resource Reports &amp; Analytics
                </h3>
              </div>
            </div>
            <ReportsTab
              schools={schools}
              resources={resources}
              requirements={requirements}
              allocations={allocations}
              decisions={decisions}
            />
          </div>
        )}

        {/* Tab: Implementation Roadmap */}
        {activeTab === 'roadmap' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Implementation Plan & Roadmap</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Building Resource Bridge step-by-step with clear explanations after each feature.
                </p>
              </div>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                All 8 Steps Completed ✓
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {phases.map((phase) => (
                <div
                  key={phase.number}
                  className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                    phase.status === 'COMPLETED'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : phase.status === 'NEXT'
                      ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-300'
                      : 'bg-white border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start sm:items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        phase.status === 'COMPLETED'
                          ? 'bg-emerald-600 text-white'
                          : phase.status === 'NEXT'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {phase.status === 'COMPLETED' ? '✓' : phase.number}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        {phase.title}
                        {phase.status === 'NEXT' && (
                          <span className="text-[10px] font-bold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            Coming Next
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{phase.desc}</div>
                    </div>
                  </div>

                  <div className="sm:self-center shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        phase.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : phase.status === 'NEXT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {phase.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal for Login & School Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Resource Add / Edit Modal */}
      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        resourceToEdit={resourceToEdit}
        schoolId={selectedSchoolForResource || currentUser?.school?._id}
        onSaveSuccess={loadAllData}
      />

      {/* School Profile Update Modal */}
      <SchoolProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        school={currentUser?.school}
        onUpdateSuccess={handleProfileUpdateSuccess}
      />

      {/* Requirement / Shortage Modal */}
      <RequirementModal
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
        schoolId={currentUser?.school?._id}
        existingResources={currentSchoolResources}
        onSubmitSuccess={loadAllData}
      />

      {/* Officer Decision Modal */}
      <DecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => {
          setIsDecisionModalOpen(false);
          setSelectedAllocationForDecision(null);
        }}
        allocation={selectedAllocationForDecision}
        requirement={selectedAllocationForDecision?.requirementId}
        officerName={currentUser?.name || 'Department Officer'}
        onDecisionSuccess={() => {
          setIsDecisionModalOpen(false);
          setSelectedAllocationForDecision(null);
          loadAllData();
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-400">
        Resource Bridge &copy; {new Date().getFullYear()} – Government School Resource Allocation & Management System
      </footer>
    </div>
  );
}

export default App;
