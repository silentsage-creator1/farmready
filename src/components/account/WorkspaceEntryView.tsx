import React, { useState } from 'react';
import { ArrowRight, Sprout } from 'lucide-react';
import { useFarmProject } from '../../context/FarmProjectContext';

export const WorkspaceEntryView: React.FC = () => {
  const { userProfile, updateUserProfile, setActiveView } = useFarmProject();
  const [name, setName] = useState(userProfile.fullName);
  const enterWorkspace = (event: React.FormEvent) => {
    event.preventDefault();
    const fullName = name.trim();
    if (!fullName) return;
    updateUserProfile({ fullName, signedInAt: new Date().toISOString() });
    setActiveView('dashboard');
  };
  return <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center"><form onSubmit={enterWorkspace} className="w-full rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-10"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white"><Sprout className="h-6 w-6" /></div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">FarmReady Nigeria</p><h1 className="mt-2 text-2xl font-bold text-neutral-950">Enter your workspace</h1><p className="mt-2 text-sm leading-relaxed text-neutral-600">Tell us your name to personalize your farm workspace and reports.</p><label className="mt-7 block text-sm font-semibold text-neutral-800" htmlFor="workspace-name">Your name</label><input id="workspace-name" autoFocus required value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Ada Okafor" className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20" /><button type="submit" disabled={!name.trim()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">Continue to workspace <ArrowRight className="h-4 w-4" /></button><p className="mt-4 text-xs text-neutral-500">Your profile is saved on this device.</p></form></div>;
};
