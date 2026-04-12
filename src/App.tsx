/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { MapCanvas } from './components/MapCanvas';
import { useMapStore } from './store';
import { supabase } from './lib/supabase';

export default function App() {
  const { kecamatans, areas, clusters, regions, user, setUser, loadData, saveData, isLoading } = useMapStore();

  // Initial Load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Auto-save effect
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        saveData();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Local feedback
      useMapStore.getState().saveData();
    }
  }, [kecamatans, areas, clusters, regions, user, saveData]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-2xl border border-slate-200 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-600">Syncing with Cloud...</span>
          </div>
        </div>
      )}
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative p-6">
          <MapCanvas />
        </main>
        <Sidebar />
      </div>
    </div>
  );
}
