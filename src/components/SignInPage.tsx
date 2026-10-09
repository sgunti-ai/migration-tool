import React from 'react';
export function SignInPage() {
  return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
    <section className="max-w-md w-full rounded-2xl border border-slate-700 bg-slate-900 p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Administrator sign-in</h1>
      <p className="text-slate-300">Use your existing Google or Microsoft account. There is no separate Migration Console username, password, or self-service account creation.</p>
      <a className="block text-center rounded-lg bg-white text-slate-950 px-4 py-3 font-semibold" href="/auth/google/start">Continue with Google</a>
      <a className="block text-center rounded-lg bg-blue-600 text-white px-4 py-3 font-semibold" href="/auth/microsoft/start">Continue with Microsoft</a>
      <p className="text-sm text-slate-400">Before the first sign-in, add your account email to the server's <code>ADMIN_EMAILS</code> setting and configure OAuth credentials for the provider you use. Only approved email addresses receive administrator access.</p>
    </section>
  </main>;
}
