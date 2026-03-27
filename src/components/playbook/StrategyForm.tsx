
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Loader2, LogIn, ArrowRightFromLine, Shield, Plus, ChevronDown, X, Smile } from 'lucide-react';
import { useCreateStrategy, useUpdateStrategy } from '@/hooks/useStrategies';
import { useToast } from '@/hooks/use-toast';
import type {
  StrategyResponseDto,
  StrategyRequestDto,
  StrategyRuleCategory,
  StrategyRuleRequestDto,
} from '@/types/dto';

interface StrategyFormProps {
  open: boolean;
  editingStrategy?: StrategyResponseDto | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface RuleItem {
  /** Temporary client-side id for keying list items */
  _key: string;
  id?: string;
  text: string;
}

const CATEGORIES: { key: StrategyRuleCategory; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: 'ENTRY',
    label: 'Entry Rules',
    icon: <LogIn className="h-4 w-4" />,
    description: 'Conditions that must be met before entering a trade',
  },
  {
    key: 'EXIT',
    label: 'Exit Rules',
    icon: <ArrowRightFromLine className="h-4 w-4" />,
    description: 'When and how to close a position',
  },
  {
    key: 'RISK_MANAGEMENT',
    label: 'Risk Management',
    icon: <Shield className="h-4 w-4" />,
    description: 'Position sizing, stop-loss, and exposure limits',
  },
];

const STRATEGY_EMOJIS = [
  '📈', '📉', '💰', '🎯', '⚡', '🔥', '💎', '🚀',
  '🐂', '🐻', '🦈', '🦅', '🏆', '⭐', '🔑', '🛡️',
  '📊', '💹', '🧠', '🎲', '⏱️', '🌊', '🔄', '💡',
  '🏦', '📐', '🎰', '🧲', '⚖️', '🔮', '🌙', '☀️',
];

let _keyCounter = 0;
const newKey = () => `rule-${++_keyCounter}`;

const StrategyForm: React.FC<StrategyFormProps> = ({ open, editingStrategy, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const createMutation = useCreateStrategy();
  const updateMutation = useUpdateStrategy();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [rules, setRules] = useState<Record<StrategyRuleCategory, RuleItem[]>>({
    ENTRY: [],
    EXIT: [],
    RISK_MANAGEMENT: [],
  });
  const [openSections, setOpenSections] = useState<Record<StrategyRuleCategory, boolean>>({
    ENTRY: true,
    EXIT: false,
    RISK_MANAGEMENT: false,
  });

  useEffect(() => {
    if (editingStrategy) {
      setName(editingStrategy.name);
      setDescription(editingStrategy.description ?? '');
      setIcon(editingStrategy.icon ?? null);
      setActive(editingStrategy.active);
      setIsDefault(editingStrategy.isDefault ?? false);

      const grouped: Record<StrategyRuleCategory, RuleItem[]> = {
        ENTRY: [],
        EXIT: [],
        RISK_MANAGEMENT: [],
      };
      const existingRules = editingStrategy.rules ?? [];
      for (const r of existingRules) {
        grouped[r.category].push({ _key: newKey(), id: r.id, text: r.text });
      }
      setRules(grouped);
    } else {
      setName('');
      setDescription('');
      setIcon(null);
      setActive(true);
      setIsDefault(false);
      setRules({ ENTRY: [], EXIT: [], RISK_MANAGEMENT: [] });
    }
  }, [editingStrategy, open]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const addRule = (category: StrategyRuleCategory) => {
    setRules((prev) => ({
      ...prev,
      [category]: [...prev[category], { _key: newKey(), text: '' }],
    }));
    // Auto-open the section when a rule is added
    setOpenSections((prev) => ({ ...prev, [category]: true }));
  };

  const updateRule = (category: StrategyRuleCategory, key: string, text: string) => {
    setRules((prev) => ({
      ...prev,
      [category]: prev[category].map((r) => (r._key === key ? { ...r, text } : r)),
    }));
  };

  const removeRule = (category: StrategyRuleCategory, key: string) => {
    setRules((prev) => ({
      ...prev,
      [category]: prev[category].filter((r) => r._key !== key),
    }));
  };

  const buildRulesPayload = (): StrategyRuleRequestDto[] => {
    const payload: StrategyRuleRequestDto[] = [];
    let order = 0;
    for (const cat of ['ENTRY', 'EXIT', 'RISK_MANAGEMENT'] as StrategyRuleCategory[]) {
      for (const rule of rules[cat]) {
        if (rule.text.trim()) {
          payload.push({
            id: rule.id,
            category: cat,
            text: rule.text.trim(),
            sortOrder: order++,
          });
        }
      }
    }
    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: t('common.error'),
        description: t('playbook.nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    const data: StrategyRequestDto = {
      name: name.trim(),
      description: description.trim() || null,
      icon: icon || null,
      active,
      isDefault,
      rules: buildRulesPayload(),
    };

    try {
      if (editingStrategy) {
        await updateMutation.mutateAsync({ id: editingStrategy.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      toast({ title: t('playbook.strategySaved') });
      onSuccess?.();
    } catch {
      toast({
        title: t('common.error'),
        description: t('playbook.saveError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel?.(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>
            {editingStrategy ? t('playbook.editStrategy') : t('playbook.newStrategy')}
          </SheetTitle>
          <SheetDescription>
            {editingStrategy
              ? t('playbook.editStrategyDescription')
              : t('playbook.newStrategyDescription')}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Basic info */}
            <div className="space-y-4">
              <p className="label-caps text-muted-foreground/60">
                {t('playbook.basicInfo', 'Basic Info')}
              </p>

              <div className="space-y-2">
                <Label>{t('playbook.strategyName')}</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-muted/20 hover:bg-muted/40 transition-colors text-lg"
                        aria-label={t('playbook.chooseIcon', 'Choose icon')}
                      >
                        {icon || <Smile className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <p className="text-xs text-muted-foreground mb-2">
                        {t('playbook.chooseIcon', 'Choose icon')}
                      </p>
                      <div className="grid grid-cols-8 gap-1">
                        {STRATEGY_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className={`flex h-8 w-8 items-center justify-center rounded-md text-base hover:bg-muted/40 transition-colors ${icon === emoji ? 'bg-primary/20 ring-1 ring-primary/40' : ''}`}
                            onClick={() => setIcon(icon === emoji ? null : emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      {icon && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 w-full h-7 text-xs text-muted-foreground"
                          onClick={() => setIcon(null)}
                        >
                          {t('playbook.removeIcon', 'Remove icon')}
                        </Button>
                      )}
                    </PopoverContent>
                  </Popover>
                  <Input
                    id="strategy-name"
                    placeholder={t('playbook.strategyNamePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy-description">{t('playbook.description')}</Label>
                <Textarea
                  id="strategy-description"
                  placeholder={t('playbook.descriptionPlaceholder')}
                  className="min-h-24 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-muted/20 px-4 py-3">
                <Switch
                  id="strategy-active"
                  checked={active}
                  onCheckedChange={setActive}
                />
                <div className="flex-1">
                  <Label htmlFor="strategy-active" className="cursor-pointer">
                    {t('playbook.activeStrategy')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('playbook.activeStrategyHint', 'Active strategies appear in the trade entry form')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-muted/20 px-4 py-3">
                <Switch
                  id="strategy-default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <div className="flex-1">
                  <Label htmlFor="strategy-default" className="cursor-pointer">
                    {t('playbook.defaultStrategy', 'Set as default')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('playbook.defaultStrategyHint', 'Automatically assign this strategy to trades imported from your broker')}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Rule builder */}
            <div className="space-y-3">
              <p className="label-caps text-muted-foreground/60">
                {t('playbook.rulesChecklist', 'Rules & Checklist')}
              </p>

              {CATEGORIES.map((cat) => {
                const catRules = rules[cat.key];
                const isOpen = openSections[cat.key];

                return (
                  <Collapsible
                    key={cat.key}
                    open={isOpen}
                    onOpenChange={(v) =>
                      setOpenSections((prev) => ({ ...prev, [cat.key]: v }))
                    }
                  >
                    <div className="rounded-xl border border-white/[0.06] bg-muted/10 overflow-hidden">
                      {/* Category header */}
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              {cat.icon}
                            </span>
                            <div>
                              <p className="text-sm font-medium">{cat.label}</p>
                              {catRules.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {catRules.length} {catRules.length === 1 ? 'rule' : 'rules'}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-2">
                          <p className="text-xs text-muted-foreground/60 mb-3">
                            {cat.description}
                          </p>

                          {catRules.map((rule) => (
                            <div key={rule._key} className="flex items-center gap-2">
                              <Input
                                value={rule.text}
                                onChange={(e) => updateRule(cat.key, rule._key, e.target.value)}
                                placeholder={t('playbook.ruleTextPlaceholder', 'Describe this rule...')}
                                className="h-9 text-sm"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                aria-label={t('common.delete', 'Delete')}
                                onClick={() => removeRule(cat.key, rule._key)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-8 w-full justify-start gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-white/[0.08] hover:border-white/[0.16]"
                            onClick={() => addRule(cat.key)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {t('playbook.addRule', 'Add rule')}
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-white/[0.06] px-6 py-4 flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default StrategyForm;
