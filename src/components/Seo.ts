import { useEffect } from 'react';

type SeoOptions = {
  title?: string;
  description?: string;
  image?: string;
};

const SITE_NAME = 'King Phone';
const DEFAULT_IMAGE = '/logo.png';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSeo({ title, description, image }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — iPhone Specialist, Bahrain`;
    document.title = fullTitle;
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    setMeta('property', 'og:title', fullTitle);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('property', 'og:image', image ?? DEFAULT_IMAGE);
    setMeta('name', 'twitter:image', image ?? DEFAULT_IMAGE);
  }, [title, description, image]);
}
