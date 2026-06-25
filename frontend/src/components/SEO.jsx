import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title,
  description,
  name = "Arogya Raksha",
  type = "website",
  url = "https://arogyarakshaa.vercel.app",
  image = "https://arogyarakshaa.vercel.app/logo.jpg",
  keywords = "",
  canonical,
  schema = null,
  robots = "index, follow",
}) => {
  const canonicalUrl = canonical || url;

  // Base MedicalOrganization Schema
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": "Arogya Raksha",
    "url": "https://arogyarakshaa.vercel.app",
    "logo": "https://arogyarakshaa.vercel.app/logo.jpg",
    "industry": "Healthcare Technology",
    "medicalSpecialty": "PublicHealth",
    "description": "AI Healthcare Platform",
    "sameAs": [
      "https://twitter.com/arogyaraksha",
      "https://www.linkedin.com/company/arogyaraksha"
    ]
  };

  // Combine schemas if a page-specific schema is provided
  const combinedSchema = schema ? [baseSchema, schema] : baseSchema;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content={name} />

      {/* Twitter tags */}
      <meta name="twitter:creator" content="@arogyaraksha" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD Schema structured data */}
      <script type="application/ld+json">
        {JSON.stringify(combinedSchema)}
      </script>
    </Helmet>
  );
};

export default SEO;
