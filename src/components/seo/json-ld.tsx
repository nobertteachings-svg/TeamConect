const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://teamconnect.com";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TeamConnect",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "Co-founder matching for startups. Founders with ideas and builders of all kinds meet, post ideas, and discover tech community events.",
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebSiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TeamConnect",
    url: BASE_URL,
    description:
      "Find a co-founder for your idea or your skills, share startup ideas, and discover tech events like hackathons and conferences.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/en/cofounders` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
