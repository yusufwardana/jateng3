/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { MapCanvas } from './components/MapCanvas';

export default function App() {
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
