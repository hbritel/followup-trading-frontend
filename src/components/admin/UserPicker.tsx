import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, X, Check, Copy } from 'lucide-react';
import { adminService, type AdminUserDto } from '@/services/admin.service';
import { cn } from '@/lib/utils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const initials = (u: AdminUserDto): string => {
  const src = u.fullName?.trim() || u.username || u.email || '?';
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';
};

// Inline copy icon used inside picker rows. Stops propagation so the row's
// pick handler doesn't fire when the admin only wants to copy the value.
function InlineCopy({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onClick(e as unknown as React.MouseEvent);
        }
      }}
      className={cn(
        'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground/70 hover:bg-muted hover:text-foreground',
        copied && 'text-emerald-500',
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </span>
  );
}

interface UserPickerProps {
  /** Single-select mode picks one user. Multi-select returns multiple via onChange. */
  mode: 'single' | 'multi';
  /** Currently selected users (for multi) or single user (for single). */
  selected: AdminUserDto[];
  /** Called when selection changes. */
  onChange: (next: AdminUserDto[]) => void;
  /** Optional list of user IDs to mark as already-selected (e.g. picked elsewhere). */
  excludeIds?: Set<string>;
  /** Optional placeholder. Defaults to a translated fallback. */
  placeholder?: string;
  /** Optional disabled flag. */
  disabled?: boolean;
}

/**
 * Searchable user picker that accepts a username, email, full name, or raw UUID.
 * - When the input matches a UUID, the value is accepted directly via the
 *   "Use UUID" button without hitting the search API.
 * - Otherwise, debounced search hits /users/search and renders a result list.
 *
 * The component is presentation-agnostic about the chip list: parents render
 * the selected users however they want (chips, inspect card, etc.).
 */
export default function UserPicker({
  mode,
  selected,
  onChange,
  excludeIds,
  placeholder,
  disabled,
}: UserPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query so we don't hammer /users/search on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const isUuid = UUID_REGEX.test(query.trim());
  const shouldSearch = !isUuid && debounced.length >= 2;

  const { data: results = [], isLoading, isError } = useQuery<AdminUserDto[]>({
    queryKey: ['admin', 'users', 'search', debounced],
    queryFn: () => adminService.searchUsers(debounced, 0, 10),
    enabled: shouldSearch,
    staleTime: 30 * 1000,
  });

  const selectedIds = new Set(selected.map((u) => u.id));
  const merged = new Set([...(excludeIds ?? []), ...selectedIds]);

  const pickUser = (u: AdminUserDto) => {
    if (mode === 'single') {
      onChange([u]);
      setQuery('');
      setOpen(false);
    } else {
      if (selectedIds.has(u.id)) {
        onChange(selected.filter((s) => s.id !== u.id));
      } else {
        onChange([...selected, u]);
      }
    }
    inputRef.current?.focus();
  };

  const useUuidDirectly = () => {
    const id = query.trim();
    // For UUID-only input, we have no other user info; build a thin DTO.
    const stub: AdminUserDto = {
      id,
      username: id.slice(0, 8),
      email: '',
      fullName: null,
      profilePictureUrl: null,
      enabled: true,
      mfaEnabled: false,
      roles: [],
      plan: null,
      lastLoginAt: null,
      createdAt: '',
      grantedByAdmin: null,
      planExpiresAt: null,
    };
    pickUser(stub);
  };

  return (
    <Popover open={open && (shouldSearch || isUuid)} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ?? t('admin.aiUsage.pickerPlaceholder', 'Username, email or UUID…')}
            className="pl-9 pr-9"
            disabled={disabled}
            aria-label={t('admin.aiUsage.pickerPlaceholder', 'Search user')}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label={t('admin.aiUsage.clearSearch', 'Clear')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-72 overflow-auto">
          {isUuid && (
            <button
              type="button"
              onClick={useUuidDirectly}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{query.trim()}</span>
              </div>
              <Badge variant="outline" className="text-xs">{t('admin.aiUsage.useUuid', 'Use UUID')}</Badge>
            </button>
          )}
          {!isUuid && shouldSearch && isLoading && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('admin.aiUsage.searching', 'Searching…')}
            </div>
          )}
          {!isUuid && shouldSearch && isError && (
            <div className="px-3 py-3 text-sm text-destructive">
              {t('admin.aiUsage.searchError', 'Search failed. Try again.')}
            </div>
          )}
          {!isUuid && shouldSearch && !isLoading && results.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t('admin.aiUsage.noUsersFound', 'No users found')}
            </div>
          )}
          {!isUuid && !shouldSearch && !query && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              {t('admin.aiUsage.pickerHint', 'Type 2+ characters to search…')}
            </div>
          )}
          {!isUuid && results.map((u) => {
            const taken = merged.has(u.id);
            const picked = selectedIds.has(u.id);
            const disabled = taken && !picked && mode === 'multi';
            const handleRowActivate = () => {
              if (disabled) return;
              pickUser(u);
            };
            return (
              <div
                key={u.id}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                aria-pressed={picked}
                onClick={handleRowActivate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowActivate();
                  }
                }}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors outline-none',
                  picked ? 'bg-primary/5' : 'hover:bg-muted focus-visible:bg-muted',
                  disabled && 'opacity-50 cursor-not-allowed',
                  !disabled && 'cursor-pointer',
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {u.profilePictureUrl && <AvatarImage src={u.profilePictureUrl} alt="" />}
                  <AvatarFallback className="text-xs">{initials(u)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{u.fullName || u.username}</span>
                    {u.plan && <Badge variant="outline" className="h-4 px-1 text-[10px]">{u.plan}</Badge>}
                    {!u.enabled && (
                      <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                        {t('admin.aiUsage.disabled', 'Disabled')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="truncate">{u.email || u.username}</span>
                    {u.email && (
                      <InlineCopy value={u.email} label={t('admin.aiUsage.copyEmail', 'Copy email')} />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground/80">
                    <span className="truncate">{u.id}</span>
                    <InlineCopy value={u.id} label={t('admin.aiUsage.copyUuid', 'Copy UUID')} />
                  </div>
                </div>
                {picked && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Selected user chip (helper for Grant section) ─────────────────────────────

export function SelectedUserChip({ user, onRemove }: {
  user: AdminUserDto;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 py-0.5 pl-1 pr-2 text-xs">
      <Avatar className="h-5 w-5">
        {user.profilePictureUrl && <AvatarImage src={user.profilePictureUrl} alt="" />}
        <AvatarFallback className="text-[10px]">{initials(user)}</AvatarFallback>
      </Avatar>
      <span className="max-w-[140px] truncate font-medium">{user.fullName || user.username || user.id.slice(0, 8)}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-4 w-4 shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export { UUID_REGEX };
