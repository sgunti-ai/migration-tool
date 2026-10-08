import React from 'react';
export function SignInPage() {
  return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
    <section className="max-w-md w-full rounded-2xl border border-slate-700 bg-slate-900 p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Migration Console</h1>
      <p className="text-slate-300">Sign in with an approved administrator account. Signing in does not connect a source or target Microsoft 365 tenant.</p>
      <a className="block text-center rounded-lg bg-white text-slate-950 px-4 py-3 font-semibold" href="/auth/google/start">Continue with Google</a>
      <a className="block text-center rounded-lg bg-blue-600 text-white px-4 py-3 font-semibold" href="/auth/microsoft/start">Continue with Microsoft</a>
      <p className="text-sm text-slate-400">Access requires an administrator invitation. Live migrations remain disabled until production connectors and verification are implemented.</p>
    </section>
  </main>;
}
