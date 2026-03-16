
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">{t('common.pageNotFound')}</p>
      <p className="text-muted-foreground mb-8">
        {t('common.pageNotFoundMessage')}
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        {t('common.goHome')}
      </Link>
    </div>
  );
};
