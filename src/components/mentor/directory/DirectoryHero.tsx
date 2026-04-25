import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DirectoryHeroProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
}

const DirectoryHero: React.FC<DirectoryHeroProps> = ({
  searchValue,
  onSearchChange,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearchChange(val);
      }, 300);
    },
    [onSearchChange]
  );

  return (
    <header className="relative py-12 md:py-16 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute top-[-30%] left-[5%] w-[380px] h-[380px] bg-primary/12 rounded-full blur-[110px]" />
        <div className="absolute bottom-[-20%] right-[8%] w-[300px] h-[300px] bg-primary/8 rounded-full blur-[90px]" />
      </div>

      <div className="container mx-auto max-w-3xl text-center px-4">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-3">
          {t('mentor.directory.hero.title')}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          {t('mentor.directory.hero.subtitle')}
        </p>

        <div className="relative max-w-xl mx-auto">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            defaultValue={searchValue}
            onChange={handleInput}
            placeholder={t('mentor.directory.searchPlaceholder')}
            className="pl-10 pr-10 h-11 rounded-xl bg-background/80 backdrop-blur-sm border-border/60 focus-visible:ring-primary/40"
            aria-label={t('mentor.directory.searchPlaceholder')}
          />
          {isLoading && (
            <Loader2
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin pointer-events-none"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default DirectoryHero;
