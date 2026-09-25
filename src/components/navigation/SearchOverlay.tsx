import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Search, TrendingUp, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import {
  addRecentSearch,
  removeRecentSearch,
  selectRecentSearches,
} from "../../features/search/recentSearchesSlice";
import { useGetSearchSuggestionsQuery, useGetTrendingSearchesQuery } from "../../services/api/searchApi";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { Skeleton } from "../ui/Skeleton";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

type FlatOption =
  | { kind: "query"; value: string }
  | { kind: "product"; id: string; slug: string; label: string }
  | { kind: "category"; id: string; slug: string; label: string };

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const { t } = useTranslation(["search", "common"]);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const recentSearches = useAppSelector(selectRecentSearches);

  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(inputValue, 200);

  const { data: suggestions, isFetching: suggestionsLoading } = useGetSearchSuggestionsQuery(
    debouncedQuery,
    { skip: !debouncedQuery.trim() }
  );
  const { data: trending } = useGetTrendingSearchesQuery(undefined, { skip: !open });

  useEffect(() => {
    if (open) {
      setInputValue("");
      setActiveIndex(-1);
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const runSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    dispatch(addRecentSearch(trimmed));
    onClose();
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const showSuggestions = debouncedQuery.trim().length > 0;

  const options: FlatOption[] = useMemo(() => {
    if (!showSuggestions) return [];
    const list: FlatOption[] = [{ kind: "query", value: inputValue }];
    suggestions?.categories.forEach((c) =>
      list.push({ kind: "category", id: c.id, slug: c.slug, label: c.name })
    );
    suggestions?.products.forEach((p) => list.push({ kind: "product", id: p.id, slug: p.slug, label: p.name }));
    return list;
  }, [showSuggestions, suggestions, inputValue]);

  const selectOption = (option: FlatOption) => {
    if (option.kind === "query") {
      runSearch(option.value);
    } else if (option.kind === "product") {
      dispatch(addRecentSearch(inputValue));
      onClose();
      navigate(`/product/${option.slug}`);
    } else {
      onClose();
      navigate(`/shop/${option.slug}`);
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && options[activeIndex]) {
        selectOption(options[activeIndex]);
      } else {
        runSearch(inputValue);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-index-command)] flex items-start justify-center bg-foreground/40 px-4 pt-[10vh] backdrop-blur-sm">
      <button
        type="button"
        aria-label={t("common:actions.close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("common:actions.search")}
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-[var(--shadow-elevation-xl)]"
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="search-listbox"
            aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
            autoComplete="off"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={onInputKeyDown}
            placeholder={t("search:placeholder")}
            className="h-8 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
          {inputValue ? (
            <button
              type="button"
              onClick={() => {
                setInputValue("");
                inputRef.current?.focus();
              }}
              aria-label={t("search:clearSearch")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3" id="search-listbox" role="listbox">
          {!showSuggestions ? (
            <div className="flex flex-col gap-6 px-2 py-2">
              {recentSearches.length > 0 ? (
                <div>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("search:recent")}
                    </span>
                  </div>
                  <ul className="flex flex-col">
                    {recentSearches.map((term) => (
                      <li key={term} className="group flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 hover:bg-surface-hover">
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={() => runSearch(term)}
                          className="flex-1 truncate text-start text-sm text-foreground"
                        >
                          {term}
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch(removeRecentSearch(term))}
                          aria-label={t("search:removeRecent")}
                          className="opacity-0 text-muted-foreground hover:text-foreground group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("search:trending")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {trending?.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => runSearch(term)}
                      className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:border-border-strong hover:bg-surface-hover"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : suggestionsLoading ? (
            <div className="flex flex-col gap-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="flex flex-col">
              {options.map((option, index) => (
                <li key={`${option.kind}-${index}`}>
                  <button
                    id={`search-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option)}
                    className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-start text-sm ${
                      activeIndex === index ? "bg-surface-hover" : ""
                    }`}
                  >
                    {option.kind === "query" ? (
                      <>
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-foreground">
                          {t("search:viewAllResults", { query: option.value })}
                        </span>
                      </>
                    ) : option.kind === "category" ? (
                      <>
                        <span className="w-4 shrink-0 text-center text-xs text-muted-foreground">#</span>
                        <span className="text-foreground">{option.label}</span>
                        <span className="ms-auto text-xs text-muted-foreground">{t("search:categories")}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-4 shrink-0" />
                        <span className="text-foreground">{option.label}</span>
                        <span className="ms-auto text-xs text-muted-foreground">{t("search:products")}</span>
                      </>
                    )}
                  </button>
                </li>
              ))}
              {!suggestionsLoading &&
              options.length === 1 &&
              (suggestions?.products.length ?? 0) === 0 &&
              (suggestions?.categories.length ?? 0) === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">{t("search:noSuggestions")}</li>
              ) : null}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
