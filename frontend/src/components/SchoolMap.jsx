import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons broken by Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom coloured marker icons
function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:30px;height:30px;border-radius:50% 50% 50% 0;
        background:${color};border:3px solid white;
        transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.35);
      "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -34],
  });
}

const ICONS = {
  surplus:  makeIcon('#16a34a'),  // green  — has unused surplus
  shortage: makeIcon('#dc2626'),  // red    — has a shortage
  repair:   makeIcon('#d97706'),  // amber  — needs repair
  normal:   makeIcon('#2563eb'),  // blue   — no issues
};

function schoolIcon(school, resources, requirements) {
  const schoolId = school._id;
  const hasShortage = requirements.some(
    r => (r.schoolId?._id || r.schoolId) === schoolId && r.shortageQuantity > 0
  );
  const hasSurplus = resources.some(
    r => (r.schoolId?._id || r.schoolId) === schoolId && r.unusedQuantity > 0
  );
  const hasRepair = resources.some(
    r => (r.schoolId?._id || r.schoolId) === schoolId && r.condition === 'Needs Repair'
  );
  if (hasShortage) return ICONS.shortage;
  if (hasSurplus)  return ICONS.surplus;
  if (hasRepair)   return ICONS.repair;
  return ICONS.normal;
}

export default function SchoolMap({ schools, resources, requirements }) {
  // Fall back to New Delhi if no schools have coords
  const validSchools = schools.filter(s => s.latitude && s.longitude);
  const centre = validSchools.length > 0
    ? [validSchools[0].latitude, validSchools[0].longitude]
    : [28.6139, 77.2090];

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-600 font-medium px-1">
        {[
          { color: '#dc2626', label: 'Shortage School' },
          { color: '#16a34a', label: 'Has Surplus' },
          { color: '#d97706', label: 'Needs Repair' },
          { color: '#2563eb', label: 'No Issues' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block border border-white shadow-sm" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 420 }}>
        {validSchools.length === 0 ? (
          <div className="h-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm">
            <div className="text-center space-y-2">
              <MapPin className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold">No GPS coordinates found in school data.</p>
              <p className="text-xs text-slate-400">Add latitude/longitude to schools to see them on the map.</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={centre}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {validSchools.map((school) => {
              const schoolResources = resources.filter(
                r => (r.schoolId?._id || r.schoolId) === school._id
              );
              const schoolReqs = requirements.filter(
                r => (r.schoolId?._id || r.schoolId) === school._id
              );
              const totalUnused = schoolResources.reduce((s, r) => s + (r.unusedQuantity || 0), 0);
              const totalShortage = schoolReqs.reduce((s, r) => s + (r.shortageQuantity || 0), 0);
              const needsRepair = schoolResources.filter(r => r.condition === 'Needs Repair').length;
              const icon = schoolIcon(school, resources, requirements);

              return (
                <Marker
                  key={school._id}
                  position={[school.latitude, school.longitude]}
                  icon={icon}
                >
                  <Popup minWidth={220}>
                    <div className="text-xs font-sans">
                      <div className="font-bold text-slate-900 text-sm mb-1">{school.schoolName}</div>
                      <div className="text-slate-500 mb-2">
                        {school.schoolCode} · {school.district}
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div className="bg-slate-50 rounded p-1 text-center">
                          <div className="text-slate-400">Students</div>
                          <div className="font-bold text-slate-800">{school.studentCount}</div>
                        </div>
                        <div className="bg-slate-50 rounded p-1 text-center">
                          <div className="text-slate-400">Classrooms</div>
                          <div className="font-bold text-slate-800">{school.classroomCount}</div>
                        </div>
                        <div className="bg-emerald-50 rounded p-1 text-center">
                          <div className="text-emerald-600">Surplus</div>
                          <div className="font-bold text-emerald-700">{totalUnused} units</div>
                        </div>
                        <div className="bg-rose-50 rounded p-1 text-center">
                          <div className="text-rose-600">Shortage</div>
                          <div className="font-bold text-rose-700">{totalShortage} units</div>
                        </div>
                      </div>
                      {needsRepair > 0 && (
                        <div className="mt-1 text-[11px] bg-amber-50 text-amber-700 rounded p-1 text-center font-medium">
                          ⚠ {needsRepair} resource type(s) need repair
                        </div>
                      )}
                      <div className="mt-1 text-[10px] text-slate-400 text-center">
                        Principal: {school.principalName}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* School cards below map */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
        {schools.map((school) => {
          const schoolResources = resources.filter(r => (r.schoolId?._id || r.schoolId) === school._id);
          const schoolReqs = requirements.filter(r => (r.schoolId?._id || r.schoolId) === school._id);
          const totalUnused = schoolResources.reduce((s, r) => s + (r.unusedQuantity || 0), 0);
          const totalShortage = schoolReqs.reduce((s, r) => s + (r.shortageQuantity || 0), 0);
          const hasShortage = totalShortage > 0;
          const hasSurplus = totalUnused > 0;
          return (
            <div key={school._id} className={`bg-white rounded-xl border p-3.5 text-xs shadow-xs ${
              hasShortage ? 'border-rose-200 bg-rose-50/20' :
              hasSurplus  ? 'border-emerald-200 bg-emerald-50/20' :
              'border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-mono text-[10px] text-slate-400">{school.schoolCode}</div>
                  <div className="font-bold text-slate-900 text-sm leading-tight">{school.schoolName.split(',')[0]}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">{school.district}</div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                  hasShortage ? 'bg-rose-500' :
                  hasSurplus  ? 'bg-emerald-500' :
                  'bg-blue-400'
                }`} />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-slate-50 rounded p-1.5 text-center">
                  <div className="text-slate-400 text-[10px]">Surplus</div>
                  <div className={`font-bold text-sm ${totalUnused > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{totalUnused}</div>
                </div>
                <div className="bg-slate-50 rounded p-1.5 text-center">
                  <div className="text-slate-400 text-[10px]">Shortage</div>
                  <div className={`font-bold text-sm ${totalShortage > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{totalShortage}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Need MapPin for the empty state above — import it inline
import { MapPin } from 'lucide-react';
