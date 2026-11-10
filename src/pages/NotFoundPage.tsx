import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-16 text-center space-y-6">
      <div className="inline-block px-4 py-1.5 bg-clay-100 text-clay-900 border border-clay-400 font-mono text-sm font-bold rounded">
        HTTP 404
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
        Page Not Found
      </h1>
      <p className="text-slate-600 max-w-md mx-auto text-base">
        The requested URL path does not exist on this Agent Allowance application instance.
      </p>

      <div className="pt-4 flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="min-h-[48px] px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-3 focus:ring-indigo-700"
        >
          Return to Overview
        </Link>
        <Link
          to="/accounts"
          className="min-h-[48px] px-6 py-3 bg-parchment-200 hover:bg-parchment-300 text-slate-900 border border-parchment-400 font-semibold rounded inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-3 focus:ring-parchment-500"
        >
          View Accounts
        </Link>
        <Link
          to="/evidence"
          className="min-h-[48px] px-6 py-3 bg-parchment-200 hover:bg-parchment-300 text-slate-900 border border-parchment-400 font-semibold rounded inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-3 focus:ring-parchment-500"
        >
          Inspect Evidence
        </Link>
      </div>
    </div>
  );
};
