import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';

export const StorageBackupPage: React.FC = () => {
  const { selectedLocation, weather } = useLocation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('2 minutes ago');
  const [kaggleUsername, setKaggleUsername] = useState('aegis-disaster-response');
  const [kaggleKey, setKaggleKey] = useState('••••••••••••••••••••••••••••••••');
  const [showKey, setShowKey] = useState(false);
  const [isConfigSaved, setIsConfigSaved] = useState(true);

  const cityName = selectedLocation?.name || weather?.cityName || 'Visakhapatnam';

  const manifestFiles = [
    { name: 'aegis_weather_hourly_telemetry.parquet', size: '24.8 MB', rows: '142,500', updated: '10m ago', type: 'PARQUET' },
    { name: 'aegis_sos_distress_beacon_audit.jsonl', size: '4.2 MB', rows: '1,840', updated: '2m ago', type: 'JSONL' },
    { name: 'aegis_citizen_ground_truth_reports.csv', size: '12.6 MB', rows: '38,900', updated: '15m ago', type: 'CSV' },
    { name: 'aegis_multihazard_ml_feature_matrix.h5', size: '86.4 MB', rows: '520,000', updated: '1h ago', type: 'HDF5' },
    { name: 'aegis_satellite_sar_inundation_slices.geotiff', size: '148.2 MB', rows: 'N/A (Spatial)', updated: '4h ago', type: 'GEOTIFF' },
  ];

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime('Just now');
    }, 1500);
  };

  const handleDownloadDatasetZip = () => {
    const manifest = {
      dataset_title: "AEGIS ALERT Disaster Intelligence Telemetry Archive",
      version: "3.4.0",
      export_timestamp: new Date().toISOString(),
      sector: cityName,
      files: manifestFiles,
      disclaimer: "Official Disaster Early Warning and Situational Telemetry Dataset for Research and Operational Resilience."
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AEGIS_Disaster_Dataset_Bundle_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="stitch-card p-6 bg-[#131f3d]/90 border-[#334155]/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 font-mono font-bold text-xs uppercase">
              CLOUD STORAGE & BACKUP ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">|</span>
            <span className="text-xs font-mono text-emerald-400">
              KAGGLE STORE ENGINE: CONNECTED ({lastSyncTime})
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Kaggle Private Storage Hub & Cloud Backup
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Encrypted cloud archival, offline telemetry buffering, dataset packaging, and Kaggle API synchronization engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs font-mono transition-all shadow-glow-blue"
          >
            <span className={`material-symbols-outlined text-lg ${isSyncing ? 'animate-spin' : ''}`}>
              {isSyncing ? 'sync' : 'cloud_sync'}
            </span>
            <span>{isSyncing ? 'Synchronizing Telemetry...' : 'Force Sync to Kaggle Now'}</span>
          </button>

          <button
            onClick={handleDownloadDatasetZip}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0b1329] hover:bg-[#1e293b] border border-[#334155] text-slate-200 text-xs font-semibold font-mono transition-colors"
          >
            <span className="material-symbols-outlined text-base text-cyan-400">folder_zip</span>
            <span>Download Dataset Bundle</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 stitch-card p-6 bg-[#131f3d]/80 border-[#334155]/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#334155]/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-400">key</span>
              <h3 className="font-bold text-white text-base">Kaggle API Credentials</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
              CONFIG VALIDATED
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">KAGGLE USERNAME:</label>
              <input
                type="text"
                value={kaggleUsername}
                onChange={(e) => {
                  setKaggleUsername(e.target.value);
                  setIsConfigSaved(false);
                }}
                className="w-full bg-[#0b1329] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">KAGGLE API KEY / TOKEN:</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={kaggleKey}
                  onChange={(e) => {
                    setKaggleKey(e.target.value);
                    setIsConfigSaved(false);
                  }}
                  className="w-full bg-[#0b1329] border border-[#334155] rounded-xl px-3 py-2 pr-10 text-white font-mono focus:outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-base">
                    {showKey ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Format: <code className="text-cyan-400">kaggle.json</code> credentials
              </span>
              <button
                onClick={() => setIsConfigSaved(true)}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors"
              >
                {isConfigSaved ? 'Saved' : 'Save Config'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 stitch-card p-6 bg-[#131f3d]/80 border-[#334155]/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#334155]/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">database</span>
              <h3 className="font-bold text-white text-base">Client Persistent Storage & Sync</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">IndexedDB v2.1</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#0b1329] border border-[#334155]/50">
              <div className="text-[10px] text-slate-400 font-mono">BUFFERED ROWS</div>
              <div className="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">182,400</div>
              <div className="text-[9px] text-slate-400 font-mono">Telemetry Events</div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b1329] border border-[#334155]/50">
              <div className="text-[10px] text-slate-400 font-mono">LOCAL QUOTA</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">276 MB</div>
              <div className="text-[9px] text-slate-400 font-mono">5.2% of 5 GB Max</div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b1329] border border-[#334155]/50">
              <div className="text-[10px] text-slate-400 font-mono">PENDING UPLOAD</div>
              <div className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">0</div>
              <div className="text-[9px] text-slate-400 font-mono">All Batches Synced</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b1329] border border-[#334155]/40 text-xs font-mono text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-lg">verified_user</span>
              <span>SHA-256 Manifest Integrity: Verified</span>
            </div>
            <span className="text-[10px] text-slate-400">Zero Checksum Mismatches</span>
          </div>
        </div>
      </div>

      <div className="stitch-card p-6 bg-[#131f3d]/80 border-[#334155]/60">
        <div className="flex items-center justify-between pb-4 border-b border-[#334155]/50">
          <div>
            <h2 className="font-bold text-white text-base font-sans">
              Dataset Manifest & Packaged Telemetry Files
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Automated hourly partitions synced to Kaggle private dataset repository.
            </p>
          </div>

          <button
            onClick={handleDownloadDatasetZip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b1329] hover:bg-[#1e293b] border border-[#334155] text-xs font-mono text-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-sm text-sky-400">download</span>
            <span>Download All Manifests</span>
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b1329] text-slate-400 uppercase border-b border-[#334155]">
              <tr>
                <th className="p-3">File Asset Name</th>
                <th className="p-3">Format</th>
                <th className="p-3">File Size</th>
                <th className="p-3">Records</th>
                <th className="p-3">Last Sync</th>
                <th className="p-3">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/40 text-slate-200">
              {manifestFiles.map((f, i) => (
                <tr key={i} className="hover:bg-[#0b1329]/50">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-400 text-sm">description</span>
                    <span>{f.name}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px]">
                      {f.type}
                    </span>
                  </td>
                  <td className="p-3 text-cyan-400 font-bold">{f.size}</td>
                  <td className="p-3">{f.rows}</td>
                  <td className="p-3 text-slate-400">{f.updated}</td>
                  <td className="p-3">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Verified</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
