import { Link } from "react-router-dom";
import { buttonVariants } from "../components/ui/Button";
import { cn } from "../lib/cn";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col items-center px-4 py-32 text-center sm:px-6 lg:px-10">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        We couldn't find that page
      </h1>
      <Link to="/" className={cn(buttonVariants({ variant: "primary" }), "mt-8")}>
        Back home
      </Link>
    </div>
  );
}
