import { baseApi } from "./baseApi";
import { delay } from "../../lib/delay";
import { computeDashboardStats, type DashboardStats } from "../../lib/adminStats";
import { listAllOrders } from "./ordersApi";
import { listMockCustomers } from "./authApi";
import { products } from "../../mocks/data/products";

/**
 * Admin API (mock). Staff-facing endpoints live here, separate from the
 * storefront API modules, so the customer-facing surface never gains an
 * "all orders / all customers" method. On a real backend every endpoint in
 * this file must require the admin role server-side (MASTER_SPEC §97).
 */
export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      queryFn: async () => {
        const stats = computeDashboardStats({
          orders: listAllOrders(),
          customerCount: listMockCustomers().length,
          products,
        });
        return { data: await delay(stats, 300) };
      },
      providesTags: [
        { type: "Order", id: "LIST" },
        { type: "User", id: "LIST" },
        { type: "Products" as const },
      ],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = adminApi;
