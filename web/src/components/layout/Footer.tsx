import React from 'react';
import { Shield, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-16 font-sans">
      {/* Emergency Helpline Banner */}
      <div className="bg-slate-950 border-b border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-200">
            <Phone className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="font-bold tracking-wider uppercase text-[11px] font-mono">
              National Emergency Helplines (India):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <a
              href="tel:112"
              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-2.5 py-1 rounded transition-colors flex items-center gap-1.5"
            >
              <span className="font-bold text-white">112</span> All-Emergency Dispatch
            </a>
            <a
              href="tel:1070"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded transition-colors flex items-center gap-1.5"
            >
              <span className="font-bold text-white">1070</span> State Disaster Control
            </a>
            <a
              href="tel:1077"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded transition-colors flex items-center gap-1.5"
            >
              <span className="font-bold text-white">1077</span> District Disaster Desk
            </a>
            <a
              href="tel:108"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded transition-colors flex items-center gap-1.5"
            >
              <span className="font-bold text-white">108</span> Emergency Medical (EMS)
            </a>
            <a
              href="tel:101"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded transition-colors flex items-center gap-1.5"
            >
              <span className="font-bold text-white">101</span> Fire & Rescue
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Source Attribution */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <Shield className="w-5 h-5 text-red-500" />
              <span>AEGIS ALERT</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Unified multi-hazard risk assessment, predictive meteorological modeling, observational incident tracking, and emergency awareness platform for India and international zones.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>System Status: 100% Operational</span>
            </div>
          </div>

          {/* Connected Telemetry Feeds */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider font-mono mb-3">
              Official Data Ingestion
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>IMD Doppler Weather Radar Network</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Central Water Commission (CWC) Gauges</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>INCOIS Ocean Early Warning Systems</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>National Center for Seismology (NCS)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Geological Survey of India (GSI) Landslides</span>
              </li>
            </ul>
          </div>

          {/* Quick Hub Navigation */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider font-mono mb-3">
              Intelligence Modules
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Multi-Hazard Predictive Timeline (+7 Days)</li>
              <li>• Live GIS Satellite & Radar Layer Explorer</li>
              <li>• Real-Time Mobile SOS Dispatch Center</li>
              <li>• State & UT Disaster Vulnerability Matrix</li>
              <li>• Verified NDRF / IMD Safety Protocol Library</li>
            </ul>
          </div>

          {/* Disclaimer & Attribution */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider font-mono mb-3">
              Public Safety Notice
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 inline mr-1" />
              <strong>Disclaimer:</strong> Meteorological warnings are algorithmic forecast models. For immediate life-safety emergencies, obey official State Disaster Management Authority (SDMA) evacuation orders and call <strong>112</strong>.
            </p>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            © 2026 AEGIS ALERT Public Safety & Hazard Web Platform. Built for disaster resilience.
          </div>
          <div className="font-mono text-[10px]">
            GPS TELEMETRY ENGINE • REFRESHED: REAL-TIME
          </div>
        </div>
      </div>
    </footer>
  );
};
