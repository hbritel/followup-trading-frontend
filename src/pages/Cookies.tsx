import { useTranslation } from 'react-i18next';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

const Cookies = () => {
  const { t } = useTranslation();

  const sections = [
    { title: t('cookies.s1Title'), content: t('cookies.s1Content') },
    { title: t('cookies.s2Title'), content: t('cookies.s2Content'), list: t('cookies.s2List', { returnObjects: true }) as string[] },
    { title: t('cookies.s3Title'), content: t('cookies.s3Content'), list: t('cookies.s3List', { returnObjects: true }) as string[] },
    { title: t('cookies.s4Title'), content: t('cookies.s4Content') },
    { title: t('cookies.s5Title'), content: t('cookies.s5Content') },
  ];

  return (
    <LegalPageLayout
      title={t('cookies.title')}
      lastUpdated={t('cookies.lastUpdated')}
      sections={sections}
    />
  );
};

export default Cookies;
