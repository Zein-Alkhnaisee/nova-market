import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart, Moon, Search, ShoppingBag, Sparkles, Sun, X } from "lucide-react";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

interface CommandPaletteProps {
  onOpenSearch: () => void;
}

export function CommandPalette({ onOpenSearch }: CommandPaletteProps) {
  const { t } = useTranslation("common");
  const commandPaletteEnabled = useFeatureFlag("commandPalette");
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  useEffect(() => {
    if (!commandPaletteEnabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) setInstanceKey((k) => k + 1);
          return !o;
        });
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [commandPaletteEnabled]);

  // A DOM side effect (not a setState call), so this is exactly what effects
  // are for — no lint concern here.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!commandPaletteEnabled || !open) return null;

  // Keying by `instanceKey` gives the dialog fresh `query`/`activeIndex`
  // state on every open via normal `useState` initializers, rather than an
  // effect that resets them — the same remount-over-reset-in-effect pattern
  // used by ProductDetailPage and avoided in SearchOverlay's older code.
  return (
    <CommandPaletteDialog key={instanceKey} onOpenSearch={onOpenSearch} onClose={() => setOpen(false)} t={t} />
  );
}

function CommandPaletteDialog({
  onOpenSearch,
  onClose,
  t,
}: {
  onOpenSearch: () => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const navigate = useNavigate();
  const { i18n } = useTranslation("common");
  const { resolvedTheme, setTheme } = useTheme();
  const aiAssistantEnabled = useFeatureFlag("aiAssistant");

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      {
        id: "search",
        label: t("commandPalette.searchProducts"),
        icon: Search,
        run: () => onOpenSearch(),
      },
      {
        id: "cart",
        label: t("commandPalette.openCart"),
        icon: ShoppingBag,
        run: () => navigate("/cart"),
      },
      {
        id: "wishlist",
        label: t("commandPalette.openWishlist"),
        icon: Heart,
        run: () => navigate("/account/wishlist"),
      },
      {
        id: "theme",
        label:
          resolvedTheme === "dark" ? t("commandPalette.switchToLight") : t("commandPalette.switchToDark"),
        icon: resolvedTheme === "dark" ? Sun : Moon,
        run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "language",
        label: i18n.language === "ar" ? t("commandPalette.switchToEnglish") : t("commandPalette.switchToArabic"),
        icon: Sparkles,
        run: () => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar"),
      },
    ];
    if (aiAssistantEnabled) {
      list.push({
        id: "assistant",
        label: t("commandPalette.openAssistant"),
        icon: Sparkles,
        run: () => navigate("/assistant"),
      });
    }
    return list;
  }, [t, i18n, resolvedTheme, setTheme, navigate, onOpenSearch, aiAssistantEnabled]);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()));

  const runCommand = (command: CommandItem) => {
    command.run();
    onClose();
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      runCommand(filtered[activeIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-[var(--z-index-command)] flex items-start justify-center bg-foreground/40 px-4 pt-[10vh] backdrop-blur-sm">
      <button
        type="button"
        aria-label={t("actions.close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("commandPalette.title")}
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-[var(--shadow-elevation-xl)]"
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            role="combobox"
            aria-expanded={true}
            aria-controls="command-palette-listbox"
            aria-activedescendant={filtered[activeIndex] ? `command-option-${activeIndex}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder={t("commandPalette.placeholder")}
            className="h-8 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t("actions.close")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul id="command-palette-listbox" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("commandPalette.noResults")}
            </li>
          ) : (
            filtered.map((command, index) => {
              const Icon = command.icon;
              return (
                <li key={command.id}>
                  <button
                    id={`command-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runCommand(command)}
                    className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-start text-sm ${
                      index === activeIndex ? "bg-surface-hover" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-foreground">{command.label}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
