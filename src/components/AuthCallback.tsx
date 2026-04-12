import { useEffect } from 'react';

export function AuthCallback() {
  useEffect(() => {
    // Supabase handles the hash/query params automatically on the client side
    // but we need to notify the parent window and close the popup
    if (window.opener) {
      window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
      window.close();
    } else {
      // Fallback for non-popup flows
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Authenticating...</h1>
        <p className="text-slate-500 mb-4">This window will close automatically.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="text-sm text-blue-600 hover:underline"
        >
          Click here if you are not redirected
        </button>
      </div>
    </div>
  );
}
