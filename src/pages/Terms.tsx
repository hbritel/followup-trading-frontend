import { useTranslation } from 'react-i18next';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

const Terms = () => {
  const { t } = useTranslation();

  const sections = [
    { title: t('terms.s1Title'), content: t('terms.s1Content') },
    { title: t('terms.s2Title'), content: t('terms.s2Content'), list: t('terms.s2List', { returnObjects: true }) as string[] },
    { title: t('terms.s3Title'), content: t('terms.s3Content'), list: t('terms.s3List', { returnObjects: true }) as string[] },
    { title: t('terms.s4Title'), content: t('terms.s4Content') },
    { title: t('terms.s5Title'), content: t('terms.s5Content') },
    { title: t('terms.s6Title'), content: t('terms.s6Content') },
    { title: t('terms.s7Title'), content: t('terms.s7Content') },
    { title: t('terms.s8Title'), content: t('terms.s8Content') },
  ];

  return (
    <LegalPageLayout
      title={t('terms.title')}
      lastUpdated={t('terms.lastUpdated')}
      sections={sections}
    />
  );
};

export default Terms;
