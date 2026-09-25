import { useTranslation } from "react-i18next";
import { Badge } from "../ui/Badge";
import type { OrderStatus } from "../../types/order";

const STATUS_TONE: Record<OrderStatus, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  pending: "neutral",
  confirmed: "accent",
  processing: "accent",
  shipped: "accent",
  out_for_delivery: "warning",
  delivered: "success",
  cancelled: "danger",
  refunded: "neutral",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation("orders");
  return <Badge tone={STATUS_TONE[status]}>{t(`status.${status}`)}</Badge>;
}
