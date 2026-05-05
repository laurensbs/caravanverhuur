// JSON-LD structured data builders.
//
// Detail pages (caravan, bestemming) en /faq embedden hun eigen
// type-specifieke schema (Product, Campground, FAQPage) inline omdat
// die het beste tegen hun lokale data aan zitten. Deze module dekt de
// generieke chains die op meerdere pages voorkomen: breadcrumb, item-list,
// contact-page.

const SITE_URL = 'https://caravanverhuurspanje.com';

// Breadcrumb chain — pass items in order from home → leaf.
export function breadcrumbJsonLd(items: Array<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.href.startsWith('http') ? item.href : `${SITE_URL}${item.href}`,
    })),
  };
}

// Generic ItemList — for catalog pages like /caravans listing many products.
// Pass items in display order; Google may show them as a rich list result.
export function itemListJsonLd(items: Array<{ name: string; href: string; image?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      url: item.href.startsWith('http') ? item.href : `${SITE_URL}${item.href}`,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

// ContactPage — used on /contact.
export function contactPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact — Caravanverhuur Spanje',
    url: `${SITE_URL}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Caravanverhuur Spanje',
      url: SITE_URL,
      email: 'info@caravanverhuurspanje.com',
      telephone: '+34650036755',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Dutch', 'English', 'Spanish'],
      },
    },
  };
}
