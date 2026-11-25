import { useEffect } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

const useFaqSchema = (faqItems: FaqItem[]) => {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.id = 'faq-schema';
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('faq-schema');
      if (existing) existing.remove();
    };
  }, [faqItems]);
};

export default useFaqSchema;
