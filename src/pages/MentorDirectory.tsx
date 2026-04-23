import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/auth-context';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import RiskDisclosureBanner from '@/components/mentor/legal/RiskDisclosureBanner';
import DirectoryHero from '@/components/mentor/directory/DirectoryHero';
import FilterRail, { type FilterValues } from '@/components/mentor/directory/FilterRail';
import FilterSheet from '@/components/mentor/directory/FilterSheet';
import SortDropdown from '@/components/mentor/directory/SortDropdown';
import ResultsGrid from '@/components/mentor/directory/ResultsGrid';
import EmptyState from '@/components/mentor/directory/EmptyState';
import PaginationFooter from '@/components/mentor/directory/PaginationFooter';
import {
  useMentorDirectory,
  useDirectoryTags,
  useDirectoryLanguages,
} from '@/hooks/useMentor';
import type { DirectoryQuery, DirectorySortKey } from '@/types/dto';

const MAX_PRICE = 200;
const PAGE_SIZE = 12;

// ── URL param helpers ────────────────────────────────────────────────────────

function readParams(sp: URLSearchParams): {
  q: string;
  tags: string[];
  langs: string[];
  minPrice: number;
  maxPrice: number;
  acceptsNew: boolean;
  freeOnly: boolean;
  sort: DirectorySortKey;
  page: number;
} {
  return {
    q: sp.get('q') ?? '',
    tags: sp.get('tags') ? sp.get('tags')!.split(',').filter(Boolean) : [],
    langs: sp.get('langs') ? sp.get('langs')!.split(',').filter(Boolean) : [],
    minPrice: Number(sp.get('minPrice') ?? 0),
    maxPrice: Number(sp.get('maxPrice') ?? MAX_PRICE),
    acceptsNew: sp.get('acceptsNew') === 'true',
    freeOnly: sp.get('freeOnly') === 'true',
    sort: (sp.get('sort') as DirectorySortKey) ?? 'RELEVANCE',
    page: Number(sp.get('page') ?? 0),
  };
}

const DEFAULT_FILTERS: FilterValues = {
  tags: [],
  langs: [],
  minPrice: 0,
  maxPrice: MAX_PRICE,
  acceptsNew: false,
  freeOnly: false,
};

const MentorDirectoryContent: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const params = readParams(searchParams);

  // Local search input state — synced to URL via debounce in DirectoryHero
  const [searchInput, setSearchInput] = useState(params.q);

  const filters: FilterValues = {
    tags: params.tags,
    langs: params.langs,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    acceptsNew: params.acceptsNew,
    freeOnly: params.freeOnly,
  };

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(updates)) {
          if (v === null || v === '' || v === 'false' || v === '0') {
            next.delete(k);
          } else {
            next.set(k, v);
          }
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  // Keep search input in sync when URL changes externally
  useEffect(() => {
    setSearchInput(params.q);
  }, [params.q]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      setParam({ q: value || null, page: null });
    },
    [setParam]
  );

  const handleFilterChange = useCallback(
    (next: Partial<FilterValues>) => {
      const updates: Record<string, string | null> = { page: null };
      if (next.tags !== undefined) updates.tags = next.tags.join(',') || null;
      if (next.langs !== undefined) updates.langs = next.langs.join(',') || null;
      if (next.minPrice !== undefined) updates.minPrice = next.minPrice > 0 ? String(next.minPrice) : null;
      if (next.maxPrice !== undefined) updates.maxPrice = next.maxPrice < MAX_PRICE ? String(next.maxPrice) : null;
      if (next.acceptsNew !== undefined) updates.acceptsNew = next.acceptsNew ? 'true' : null;
      if (next.freeOnly !== undefined) {
        updates.freeOnly = next.freeOnly ? 'true' : null;
        if (next.freeOnly) updates.maxPrice = '0';
        else updates.maxPrice = null;
      }
      setParam(updates);
    },
    [setParam]
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
    setSearchInput('');
  }, [setSearchParams]);

  const handleSortChange = useCallback(
    (sort: DirectorySortKey) => {
      setParam({ sort: sort === 'RELEVANCE' ? null : sort, page: null });
    },
    [setParam]
  );

  const handlePageChange = useCallback(
    (delta: number) => {
      const next = Math.max(0, params.page + delta);
      setParam({ page: next === 0 ? null : String(next) });
    },
    [params.page, setParam]
  );

  // Build API query
  const apiQuery: DirectoryQuery = {
    q: params.q || undefined,
    tags: params.tags.length ? params.tags : undefined,
    langs: params.langs.length ? params.langs : undefined,
    minPrice: params.minPrice > 0 ? params.minPrice : undefined,
    maxPrice: params.freeOnly ? 0 : params.maxPrice < MAX_PRICE ? params.maxPrice : undefined,
    acceptsNew: params.acceptsNew || undefined,
    monetizedOnly: params.freeOnly ? false : undefined,
    sort: params.sort !== 'RELEVANCE' ? params.sort : undefined,
    page: params.page,
    size: PAGE_SIZE,
  };

  const { data, isLoading, isError } = useMentorDirectory(apiQuery);
  const { data: tagsData = [] } = useDirectoryTags();
  const { data: langsData } = useDirectoryLanguages();

  // Show error toast once
  useEffect(() => {
    if (isError) {
      toast.error(t('common.error', 'Something went wrong. Please try again.'));
    }
  }, [isError, t]);

  const cards = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const availableLanguages = langsData?.used ?? [];

  const activeFilterCount = [
    filters.tags.length > 0,
    filters.langs.length > 0,
    filters.minPrice > 0,
    filters.maxPrice < MAX_PRICE,
    filters.acceptsNew,
    filters.freeOnly,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-background">
      <DirectoryHero
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
      />

      <div className="container mx-auto max-w-7xl px-4 pb-16">
        <RiskDisclosureBanner className="mb-6" />

        <div className="flex gap-8">
          {/* Desktop filter rail */}
          <aside
            className="hidden lg:block w-[260px] shrink-0"
            aria-label={t('mentor.directory.filters.niche')}
          >
            <div className="sticky top-20">
              <FilterRail
                tags={tagsData}
                languages={availableLanguages}
                values={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
              />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              {/* Mobile filter trigger */}
              <div className="lg:hidden">
                <FilterSheet
                  tags={tagsData}
                  languages={availableLanguages}
                  values={filters}
                  onChange={handleFilterChange}
                  onClear={handleClearFilters}
                  activeCount={activeFilterCount}
                />
              </div>

              <p className="text-sm text-muted-foreground tabular-nums">
                {!isLoading && (
                  <>{totalElements} {t('mentor.directory.resultsCount', { count: totalElements })}</>
                )}
              </p>

              <SortDropdown value={params.sort} onChange={handleSortChange} />
            </div>

            {/* Results */}
            {!isLoading && !isError && cards.length === 0 ? (
              <EmptyState onClearFilters={handleClearFilters} />
            ) : (
              <ResultsGrid cards={cards} tags={tagsData} isLoading={isLoading} />
            )}

            {/* Pagination */}
            <PaginationFooter
              page={params.page}
              totalPages={totalPages}
              totalElements={totalElements}
              onPrev={() => handlePageChange(-1)}
              onNext={() => handlePageChange(1)}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

const MentorDirectory: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  if (isAuthenticated) {
    return (
      <WebSocketProvider>
        <DashboardLayout pageTitle={t('sidebar.browseMentors', 'Browse Mentors')}>
          <MentorDirectoryContent />
        </DashboardLayout>
      </WebSocketProvider>
    );
  }
  return <MentorDirectoryContent />;
};

export default MentorDirectory;
