import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { useAuth } from '@/contexts/auth-context';
import RiskDisclosureBanner from '@/components/mentor/legal/RiskDisclosureBanner';
import DirectoryHero from '@/components/mentor/directory/DirectoryHero';
import FilterRail, { type FilterValues } from '@/components/mentor/directory/FilterRail';
import FilterSheet from '@/components/mentor/directory/FilterSheet';
import SortDropdown from '@/components/mentor/directory/SortDropdown';
import ResultsGrid from '@/components/mentor/directory/ResultsGrid';
import EmptyState from '@/components/mentor/directory/EmptyState';
import PaginationFooter from '@/components/mentor/directory/PaginationFooter';
import ActiveFiltersBar from '@/components/mentor/directory/ActiveFiltersBar';
import SearchAlertForm from '@/components/mentor/alerts/SearchAlertForm';
import MentorSpotlight from '@/components/mentor/directory/MentorSpotlight';
import {
  useMentorDirectory,
  useDirectoryTags,
  useDirectoryLanguages,
} from '@/hooks/useMentor';
import type { DirectoryQuery, DirectorySortKey } from '@/types/dto';

const MAX_PRICE = 200;
const PAGE_SIZE = 12;
const POPULAR_TAG_COUNT = 6;

// ── URL param helpers ────────────────────────────────────────────────────────

function readParams(sp: URLSearchParams): {
  q: string;
  tags: string[];
  langs: string[];
  minPrice: number;
  maxPrice: number;
  acceptsNew: boolean;
  freeOnly: boolean;
  verifiedOnly: boolean;
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
    verifiedOnly: sp.get('verifiedOnly') === 'true',
    sort: (sp.get('sort') as DirectorySortKey) ?? 'RELEVANCE',
    page: Number(sp.get('page') ?? 0),
  };
}

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
    verifiedOnly: params.verifiedOnly,
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
      if (next.verifiedOnly !== undefined) updates.verifiedOnly = next.verifiedOnly ? 'true' : null;
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
    verifiedOnly: params.verifiedOnly || undefined,
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
    filters.verifiedOnly,
  ].filter(Boolean).length;

  // Top niches by sortOrder — surfaced as one-click pills in the hero so
  // visitors can refine without opening the full filter rail. Memoized so
  // the hero doesn't re-render on every parent state change.
  const popularTags = useMemo(
    () =>
      [...tagsData]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, POPULAR_TAG_COUNT),
    [tagsData],
  );

  const handleHeroTagToggle = useCallback(
    (slug: string) => {
      const next = filters.tags.includes(slug)
        ? filters.tags.filter((s) => s !== slug)
        : [...filters.tags, slug];
      handleFilterChange({ tags: next });
    },
    [filters.tags, handleFilterChange],
  );

  return (
    <div className="space-y-6">
      <DirectoryHero
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        popularTags={popularTags}
        selectedTagSlugs={filters.tags}
        onTagToggle={handleHeroTagToggle}
        totalElements={totalElements}
      />

      <RiskDisclosureBanner />

      <div className="flex gap-6 lg:gap-8">
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
          <section className="flex-1 min-w-0" aria-labelledby="directory-results-heading">
            {/* Visually-hidden h2 anchors document outline between hero h1
                and card h3s — fixes WCAG 1.3.1 heading-skip violation. */}
            <h2 id="directory-results-heading" className="sr-only">
              {t('mentor.directory.resultsHeading', 'Mentors')}
            </h2>

            {/* Featured mentor spotlight — only on page 1 when no search query */}
            {params.page === 0 && !params.q && cards.length >= 3 && (
              <MentorSpotlight />
            )}

            {/* Toolbar — count left, sort + save-search right; mobile filter
                button gets first slot when shown. */}
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
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
                {!isLoading && (
                  <p className="text-sm text-muted-foreground tabular-nums">
                    <span className="font-semibold text-foreground">
                      {totalElements}
                    </span>{' '}
                    {t('mentor.directory.resultsCount', {
                      count: totalElements,
                    })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <SearchAlertForm currentQuery={apiQuery} />
                <SortDropdown value={params.sort} onChange={handleSortChange} />
              </div>
            </div>

            {/* Active filter chips — removable per-filter + clear-all */}
            <ActiveFiltersBar
              filters={filters}
              tags={tagsData}
              maxPrice={MAX_PRICE}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />

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
          </section>
      </div>
    </div>
  );
};

const MentorDirectory: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  if (isAuthenticated) {
    return (
      <WebSocketProvider>
        <DashboardLayout pageTitle={t('sidebar.browseMentors', 'Browse mentors')}>
          <MentorDirectoryContent />
        </DashboardLayout>
      </WebSocketProvider>
    );
  }
  // Anonymous browse — wrap in a max-width container so it doesn't run
  // edge-to-edge on desktop without the dashboard chrome.
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <MentorDirectoryContent />
      </div>
    </main>
  );
};

export default MentorDirectory;
