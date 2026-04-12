/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { MapCanvas } from './components/MapCanvas';
import { AuthCallback } from './components/AuthCallback';
import { useMapStore } from './store';
import { supabase } from './lib/supabase';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const loadFromSupabase = useMapStore((state) => state.loadFromSupabase);
  const setUser = useMapStore((state) => state.setUser);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        // Refresh data or update state after successful login
        loadFromSupabase();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      subscription.unsubscribe();
    };
  }, [loadFromSupabase, setUser]);

  if (path.startsWith('/auth/callback')) {
    return <AuthCallback />;
  }

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
