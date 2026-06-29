import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 text-center">
      <SEO 
        title="Page Not Found | Arogya Raksha AI"
        description="The page you are looking for does not exist or has been moved."
        robots="noindex, follow"
      />
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-8xl font-black text-primary/20 dark:text-secondary/20">404</div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Page Not Found</h1>
        <p className="text-slate-600 dark:text-slate-400">
          We can't seem to find the page you're looking for. It might have been removed or the link might be broken.
        </p>
        <Link 
          to="/"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover dark:bg-secondary dark:hover:bg-teal-400 text-white dark:text-slate-900 px-6 py-3 rounded-full font-bold transition-all"
        >
          <span className="material-symbols-outlined">home</span>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
