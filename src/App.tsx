/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { MapCanvas } from './components/MapCanvas';
import { useMapStore } from './store';

export default function App() {
  const { loadData, saveData, kecamatans, areas, clusters, regions } = useMapStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      saveData();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timer);
  }, [kecamatans, areas, clusters, regions, saveData]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
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
