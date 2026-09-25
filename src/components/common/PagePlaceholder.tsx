interface PagePlaceholderProps {
  title: string;
  description?: string;
}

/**
 * Temporary placeholder used for routes whose full feature build-out is
 * scheduled for a later phase (see PROGRESS.md). Routing, AppShell, theming,
 * i18n and RTL already work correctly on every one of these routes — only
 * the page content itself is still pending.
 */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Coming up
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
