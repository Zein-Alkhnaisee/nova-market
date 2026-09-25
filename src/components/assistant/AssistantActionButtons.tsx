import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useAppDispatch } from "../../app/store/hooks";
import { addToCart } from "../../features/cart/cartSlice";
import { toggleCompare } from "../../features/compare/compareSlice";
import { toggleWishlist } from "../../features/wishlist/wishlistSlice";
import { useGetProductsQuery } from "../../services/api/productsApi";
import type { AssistantAction } from "../../types/assistant";

export function AssistantActionButtons({ actions }: { actions: AssistantAction[] }) {
  const { t } = useTranslation("assistant");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: allProducts, isLoading: productsLoading } = useGetProductsQuery();
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const runAction = (action: AssistantAction) => {
    switch (action.type) {
      case "view_product":
        navigate(`/product/${action.payload}`);
        break;
      case "add_to_cart": {
        const product = allProducts?.find((p) => p.id === action.payload);
        if (product) {
          dispatch(addToCart({ product }));
          setConfirmedIds((prev) => new Set(prev).add(action.id));
        }
        break;
      }
      case "add_to_compare":
        dispatch(toggleCompare(action.payload));
        setConfirmedIds((prev) => new Set(prev).add(action.id));
        break;
      case "add_to_wishlist":
        dispatch(toggleWishlist(action.payload));
        setConfirmedIds((prev) => new Set(prev).add(action.id));
        break;
      case "view_comparison":
        action.payload.split(",").forEach((productId) => dispatch(toggleCompare(productId)));
        navigate("/compare");
        break;
      case "search":
        navigate(`/search?q=${encodeURIComponent(action.payload)}`);
        break;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const confirmed = confirmedIds.has(action.id);
        // Only add_to_cart needs the fetched product list (cartSlice.addToCart
        // takes a full ProductSummary, not just an id) — disable just that
        // action while products are still loading, rather than blocking every
        // button or, worse, leaving it silently clickable-but-broken until the
        // fetch resolves.
        const disabled = action.type === "add_to_cart" && productsLoading;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => runAction(action)}
            disabled={disabled}
            aria-busy={disabled || undefined}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            {confirmed ? <Check className="h-3 w-3 text-success" /> : null}
            {t(`actions.${action.type}`, { defaultValue: action.label })}
          </button>
        );
      })}
    </div>
  );
}
