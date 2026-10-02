import { baseApi } from "./baseApi";
import { delay } from "../../lib/delay";
import { computeDashboardStats, type DashboardStats } from "../../lib/adminStats";
import { listAllOrders } from "./ordersApi";
import { listMockCustomers } from "./authApi";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type CategoryDeleteResult,
  type CategoryInput,
  type CategoryWriteResult,
} from "../catalog/categoryStore";
import type { Category } from "../../types/product";
import {
  archiveProduct,
  createProduct,
  getProductById,
  listProducts,
  restoreProduct,
  updateProduct,
  type ProductInput,
  type ProductWriteResult,
  type StoredProduct,
} from "../catalog/productStore";
import {
  buildCustomerDetail,
  buildCustomerSummaries,
  type CustomerDetail,
  type CustomerSummary,
} from "../../lib/adminCustomers";

/**
 * Everything a product write can make stale: the storefront's product lists and
 * detail, recommendations, and search suggestions, plus admin's own views.
 * Type-only tags invalidate every entry of that type.
 */
const PRODUCT_CHANGED_TAGS = [
  { type: "Products" as const },
  { type: "Product" as const },
  { type: "Recommendation" as const },
  { type: "Search" as const, id: "SUGGESTIONS" },
];
const afterWrite = (result: ProductWriteResult | undefined) => (result?.ok ? PRODUCT_CHANGED_TAGS : []);

/** What a category write can make stale: the category list/shop nav, search suggestions, and recommendation reason text. */
const CATEGORY_CHANGED_TAGS = [
  { type: "Category" as const },
  { type: "Search" as const, id: "SUGGESTIONS" },
  { type: "Recommendation" as const },
];
const afterCategoryWrite = (result: { ok: boolean } | undefined) => (result?.ok ? CATEGORY_CHANGED_TAGS : []);

export interface AdminCategoryRow extends Category {
  /** Active (non-archived) products. */
  productCount: number;
  archivedProductCount: number;
}

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
          products: listProducts(),
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

    // ---- Products (shared catalog store; see services/catalog/productStore.ts) ----
    // Writes return a result union instead of throwing: a validation failure is
    // an expected outcome the form renders field by field, not an exception.
    getAdminProducts: builder.query<StoredProduct[], void>({
      queryFn: async () => ({ data: await delay(listProducts({ includeArchived: true }), 250) }),
      providesTags: [{ type: "Products" as const, id: "ADMIN" }],
    }),
    getAdminProduct: builder.query<StoredProduct, string>({
      queryFn: async (id) => {
        const product = getProductById(id, { includeArchived: true });
        if (!product) return { error: { status: 404, message: "Product not found." } };
        return { data: await delay(product, 200) };
      },
      providesTags: (_r, _e, id) => [{ type: "Product" as const, id }],
    }),
    createAdminProduct: builder.mutation<ProductWriteResult, ProductInput>({
      queryFn: async (input) => ({ data: await delay(createProduct(input), 300) }),
      invalidatesTags: (result) => afterWrite(result),
    }),
    updateAdminProduct: builder.mutation<ProductWriteResult, { id: string; input: ProductInput }>({
      queryFn: async ({ id, input }) => ({ data: await delay(updateProduct(id, input), 300) }),
      invalidatesTags: (result) => afterWrite(result),
    }),
    setAdminProductArchived: builder.mutation<ProductWriteResult, { id: string; archived: boolean }>({
      queryFn: async ({ id, archived }) => ({
        data: await delay(archived ? archiveProduct(id) : restoreProduct(id), 200),
      }),
      invalidatesTags: (result) => afterWrite(result),
    }),

    // ---- Categories (shared category store; see services/catalog/categoryStore.ts) ----
    getAdminCategories: builder.query<AdminCategoryRow[], void>({
      queryFn: async () => {
        const all = listProducts({ includeArchived: true });
        const rows = listCategories().map((c): AdminCategoryRow => {
          const mine = all.filter((p) => p.categoryId === c.id);
          const archived = mine.filter((p) => p.archivedAt !== undefined).length;
          return { ...c, productCount: mine.length - archived, archivedProductCount: archived };
        });
        return { data: await delay(rows, 250) };
      },
      // Product counts depend on products, so product writes (which invalidate "Products") refresh this too.
      providesTags: [
        { type: "Category" as const, id: "ADMIN" },
        { type: "Products" as const, id: "ADMIN" },
      ],
    }),
    createAdminCategory: builder.mutation<CategoryWriteResult, CategoryInput>({
      queryFn: async (input) => ({ data: await delay(createCategory(input), 300) }),
      invalidatesTags: (result) => afterCategoryWrite(result),
    }),
    updateAdminCategory: builder.mutation<CategoryWriteResult, { id: string; input: Pick<CategoryInput, "name" | "image"> }>({
      queryFn: async ({ id, input }) => ({ data: await delay(updateCategory(id, input), 300) }),
      invalidatesTags: (result) => afterCategoryWrite(result),
    }),
    deleteAdminCategory: builder.mutation<CategoryDeleteResult, string>({
      queryFn: async (id) => ({ data: await delay(deleteCategory(id), 250) }),
      invalidatesTags: (result) => afterCategoryWrite(result),
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetAdminCustomersQuery,
  useGetAdminCustomerQuery,
  useGetAdminProductsQuery,
  useGetAdminProductQuery,
  useCreateAdminProductMutation,
  useUpdateAdminProductMutation,
  useSetAdminProductArchivedMutation,
  useGetAdminCategoriesQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
} = adminApi;
