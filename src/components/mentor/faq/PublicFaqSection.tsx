import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { MentorFaqDto } from '@/types/dto';

interface PublicFaqSectionProps {
  faq: MentorFaqDto[];
}

const PublicFaqSection: React.FC<PublicFaqSectionProps> = ({ faq }) => {
  const { t } = useTranslation();

  if (!faq.length) return null;

  const sorted = [...faq].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section aria-labelledby="faq-heading" className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
      <h2 id="faq-heading" className="text-lg font-semibold">
        {t('mentor.faq.public.title', 'Frequently asked questions')}
      </h2>

      <Accordion type="single" collapsible className="w-full">
        {sorted.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="text-sm text-left font-medium leading-snug hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default PublicFaqSection;
