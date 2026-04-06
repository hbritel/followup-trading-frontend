import { useTranslation } from 'react-i18next';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

const Privacy = () => {
  const { t } = useTranslation();

  const sections = [
    { title: t('privacy.s1Title'), content: t('privacy.s1Content') },
    { title: t('privacy.s2Title'), content: t('privacy.s2Content'), list: t('privacy.s2List', { returnObjects: true }) as string[] },
    { title: t('privacy.s3Title'), content: t('privacy.s3Content'), list: t('privacy.s3List', { returnObjects: true }) as string[] },
    { title: t('privacy.s4Title'), content: t('privacy.s4Content'), list: t('privacy.s4List', { returnObjects: true }) as string[] },
    { title: t('privacy.s5Title'), content: t('privacy.s5Content') },
    { title: t('privacy.s6Title'), content: t('privacy.s6Content') },
    { title: t('privacy.s7Title'), content: t('privacy.s7Content'), list: t('privacy.s7List', { returnObjects: true }) as string[] },
    { title: t('privacy.s8Title'), content: t('privacy.s8Content') },
    { title: t('privacy.s9Title'), content: t('privacy.s9Content') },
  ];

  return (
    <LegalPageLayout
      title={t('privacy.title')}
      lastUpdated={t('privacy.lastUpdated')}
      sections={sections}
    />
  );
};

export default Privacy;
