import { baseApi } from "./baseApi";
import { delay } from "../../lib/delay";
import { computeDashboardStats, type DashboardStats } from "../../lib/adminStats";
import { listAllOrders } from "./ordersApi";
import { listMockCustomers } from "./authApi";
import { products } from "../../mocks/data/products";
import {
  buildCustomerDetail,
  buildCustomerSummaries,
  type CustomerDetail,
  type CustomerSummary,
} from "../../lib/adminCustomers";

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
    getAdminCustomers: builder.query<{ customers: CustomerSummary[]; unlinkedOrderCount: number }, void>({
      queryFn: async () => {
        const result = buildCustomerSummaries(listMockCustomers(), listAllOrders());
        return { data: await delay(result, 250) };
      },
      providesTags: [
        { type: "Order", id: "LIST" },
        { type: "User", id: "LIST" },
      ],
    }),
    getAdminCustomer: builder.query<CustomerDetail, string>({
      queryFn: async (id) => {
        const customer = listMockCustomers().find((c) => c.id === id);
        // Admin accounts are not customers, so they 404 here too.
        if (!customer) return { error: { status: 404, message: "Customer not found." } };
        return { data: await delay(buildCustomerDetail(customer, listAllOrders()), 250) };
      },
      providesTags: (_r, _e, id) => [
        { type: "User", id },
        { type: "Order", id: "LIST" },
      ],
    }),
  }),
});

export const { useGetDashboardStatsQuery, useGetAdminCustomersQuery, useGetAdminCustomerQuery } = adminApi;
