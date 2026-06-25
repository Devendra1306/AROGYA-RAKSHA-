import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return null; // Don't show breadcrumbs on the home page
  }

  const breadcrumbListSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://arogyaraksha.com/"
      },
      ...pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        // Convert slug to readable name
        const name = value
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        return {
          "@type": "ListItem",
          "position": index + 2,
          "name": name,
          "item": `https://arogyaraksha.com${to}`
        };
      })
    ]
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbListSchema)}
        </script>
      </Helmet>
      
      <nav aria-label="breadcrumb" className="py-2 text-xs text-slate-500 dark:text-slate-400">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="hover:text-primary dark:hover:text-secondary transition-colors">
              Home
            </Link>
          </li>
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const name = value
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            return (
              <li key={to} className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
                {last ? (
                  <span className="text-slate-800 dark:text-slate-100 font-semibold" aria-current="page">
                    {name}
                  </span>
                ) : (
                  <Link to={to} className="hover:text-primary dark:hover:text-secondary transition-colors">
                    {name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;
