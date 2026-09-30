import React, { useEffect, useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { Check, Shield, Bell, Globe, Sliders } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { appPreferences, updateAppPreferences, createWorkspaceBackup, restoreWorkspaceBackup } = useFarmProject();
  const [unit, setUnit] = useState(appPreferences.defaultAreaUnit);
  const [showActionAlerts, setShowActionAlerts] = useState(appPreferences.showActionAlerts);
  const [saved, setSaved] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');

  useEffect(() => { setUnit(appPreferences.defaultAreaUnit); setShowActionAlerts(appPreferences.showActionAlerts); }, [appPreferences]);

  const handleSave = () => {
    updateAppPreferences({ defaultAreaUnit: unit, showActionAlerts });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const downloadBackup = () => {
    const blob = new Blob([createWorkspaceBackup()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FarmReady_Workspace_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupMessage('Workspace backup downloaded to your device.');
  };

  const restoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      restoreWorkspaceBackup(await file.text());
      setBackupMessage('Workspace restored from backup.');
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'Could not restore this backup.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          Platform Settings
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Configure currency defaults, measurement units, and advisory alerts.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Preferences */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Globe className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Regional & Economic Preferences
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Currency</label>
            <p className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700">Nigerian Naira (₦ — NGN)</p>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Default Land Area Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as typeof unit)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            >
              <option value="hectares">Hectares (Standard Commercial)</option>
              <option value="acres">Acres</option>
              <option value="plots">Standard Plots (50ft x 100ft)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Bell className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Advisory Notifications
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl cursor-pointer">
            <div>
              <p className="font-semibold text-neutral-900">Funding Gap & Milestone Alerts</p>
            <p className="text-neutral-500 text-[11px]">Show current funding and readiness actions in the app</p>
            </div>
            <input
              type="checkbox"
              checked={showActionAlerts}
              onChange={(e) => setShowActionAlerts(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
          </label>

          <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-[11px] text-neutral-600">Commodity price updates are unavailable until a verified market-price data source is connected.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
        >
          Save Preferences
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
        <div><h3 className="text-sm font-bold text-neutral-900">Workspace backup</h3><p className="mt-1 text-xs text-neutral-500">Project data is stored in this browser. Download a backup before clearing browser data or moving to another device. Restoring replaces the current local workspace.</p></div>
        <div className="flex flex-wrap gap-3"><button onClick={downloadBackup} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50">Download Backup</button><label className="cursor-pointer rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800">Restore Backup<input type="file" accept="application/json,.json" onChange={restoreBackup} className="sr-only" /></label></div>
        {backupMessage && <p role="status" className="text-xs text-neutral-600">{backupMessage}</p>}
      </div>
    </div>
  );
};
