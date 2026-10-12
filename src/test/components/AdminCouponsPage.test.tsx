import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminCouponsPage } from "../../pages/admin/AdminCouponsPage";
import { createTestStore, renderWithProviders } from "../renderWithProviders";
import { createCoupon, deleteCoupon, findActiveCoupon, getCouponById, listCoupons } from "../../services/catalog/couponStore";
import { ordersApi, type PlaceOrderInput } from "../../services/api/ordersApi";

const orderInput = (couponCode: string): PlaceOrderInput => ({
  lines: [{ productId: "p1", slug: "p1", name: "Widget", image: "i.jpg", price: 50, currency: "USD", quantity: 1 }],
  shippingAddress: { fullName: "Jo", line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" },
  deliveryOption: { id: "s", label: "S", etaDays: "5", price: 0 },
  discountPercent: 10,
  paymentSummary: { brand: "Visa", last4: "4242" },
  couponCode,
});
const placeWith = (code: string) => createTestStore().dispatch(ordersApi.endpoints.placeOrder.initiate(orderInput(code)));
const rowFor = (code: string) => within(screen.getByRole("table")).getByText(code).closest("tr") as HTMLElement;
const dataRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);

// The mock order store is module-level state shared by every test in this file,
// so these tests are order-dependent by necessity: the empty state must run
// first (before any order exists) and used-coupon tests come after.
describe("Admin coupons page", () => {
  it("shows a designed empty state when every coupon has been deleted", async () => {
    listCoupons().forEach((c) => deleteCoupon(c.id));
    renderWithProviders(<AdminCouponsPage />);
    expect(await screen.findByText("No coupons")).toBeInTheDocument();
  });

  it("shows a skeleton, then every coupon with its discount, status and usage", async () => {
    renderWithProviders(<AdminCouponsPage />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    await screen.findByRole("table", { name: "Coupons" });
    expect(dataRows()).toHaveLength(2);
    expect(rowFor("SAVE10")).toHaveTextContent("10%");
    expect(rowFor("SAVE10")).toHaveTextContent("Active");
    expect(rowFor("WELCOME15")).toHaveTextContent("15%");
    expect(within(rowFor("SAVE10")).getAllByRole("cell")[2]).toHaveTextContent("0"); // used in orders
  });

  it("creates a coupon (code upper-cased) that is immediately usable at checkout", async () => {
    renderWithProviders(<AdminCouponsPage />);
    await screen.findByRole("table", { name: "Coupons" });
    await userEvent.click(screen.getByRole("button", { name: "New coupon" }));
    await userEvent.type(screen.getByLabelText("Code"), "summer20");
    await userEvent.type(screen.getByLabelText("Discount (%)"), "20");
    await userEvent.type(screen.getByLabelText("Note"), "Summer sale");
    await userEvent.click(screen.getByRole("button", { name: "Create coupon" }));

    expect(await screen.findByText("SUMMER20 created.")).toBeInTheDocument();
    // The list refetches after the write (cache invalidation), so wait for the new row.
    const row = (await within(await screen.findByRole("table")).findByText("SUMMER20")).closest("tr") as HTMLElement;
    expect(row).toHaveTextContent("20%");
    expect(row).toHaveTextContent("Summer sale");
    expect(findActiveCoupon("summer20")?.percentOff).toBe(20);
  });

  it("shows field errors with aria wiring and focus, and writes nothing", async () => {
    renderWithProviders(<AdminCouponsPage />);
    await screen.findByRole("table", { name: "Coupons" });
    const before = listCoupons().length;
    await userEvent.click(screen.getByRole("button", { name: "New coupon" }));
    await userEvent.click(screen.getByRole("button", { name: "Create coupon" }));

    const code = await screen.findByLabelText("Code");
    await waitFor(() => expect(code).toHaveAttribute("aria-invalid", "true"));
    expect(code).toHaveAccessibleDescription(/This field is required\./);
    await waitFor(() => expect(code).toHaveFocus());
    expect(screen.getByLabelText("Discount (%)")).toHaveAttribute("aria-invalid", "true");
    expect(listCoupons()).toHaveLength(before);
  });

  it("rejects an out-of-range percentage and a duplicate code (case-insensitive)", async () => {
    renderWithProviders(<AdminCouponsPage />);
    await screen.findByRole("table", { name: "Coupons" });
    await userEvent.click(screen.getByRole("button", { name: "New coupon" }));
    await userEvent.type(screen.getByLabelText("Code"), "save10");
    await userEvent.type(screen.getByLabelText("Discount (%)"), "150");
    await userEvent.click(screen.getByRole("button", { name: "Create coupon" }));
    expect(await screen.findByText("Enter a whole number from 1 to 100.")).toBeInTheDocument();
    expect(screen.getByText("This code is already used by another coupon.")).toBeInTheDocument();
  });

  it("edits percent and deactivates, with the code shown read-only; checkout reflects it at once", async () => {
    renderWithProviders(<AdminCouponsPage />);
    await screen.findByRole("table", { name: "Coupons" });
    await userEvent.click(screen.getByRole("button", { name: "Edit SAVE10" }));

    expect(screen.queryByLabelText("Code")).not.toBeInTheDocument(); // not an input
    expect(screen.getByText(/code can't be changed after creation/i)).toBeInTheDocument();
    const percent = screen.getByLabelText("Discount (%)");
    expect(percent).toHaveValue(10);
    await userEvent.clear(percent);
    await userEvent.type(percent, "25");
    await userEvent.click(screen.getByRole("checkbox", { name: /^Active/ }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("SAVE10 updated.")).toBeInTheDocument();
    await waitFor(() => expect(rowFor("SAVE10")).toHaveTextContent("25%")); // list refetches after the write
    expect(rowFor("SAVE10")).toHaveTextContent("Inactive");
    expect(getCouponById("coupon-save10")).toMatchObject({ code: "SAVE10", percentOff: 25, active: false });
    expect(findActiveCoupon("SAVE10")).toBeUndefined();
  });

  it("deletes an unused coupon only after confirmation, defaulting focus to the safe choice", async () => {
    renderWithProviders(<AdminCouponsPage />);
    await screen.findByRole("table", { name: "Coupons" });

    await userEvent.click(screen.getByRole("button", { name: "Delete WELCOME15" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete WELCOME15?" });
    expect(within(dialog).getByRole("button", { name: "Keep it" })).toHaveFocus();
    expect(getCouponById("coupon-welcome15")).toBeDefined(); // nothing happens until confirmed

    await userEvent.click(within(dialog).getByRole("button", { name: "Keep it" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(getCouponById("coupon-welcome15")).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "Delete WELCOME15" }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete coupon" }));
    expect(await screen.findByText("WELCOME15 deleted.")).toBeInTheDocument();
    expect(getCouponById("coupon-welcome15")).toBeUndefined();
    expect(findActiveCoupon("WELCOME15")).toBeUndefined();
  });

  it("disables Delete for a coupon an order used, explains why, and counts the usage", async () => {
    createCoupon({ code: "USED1", percentOff: 10 });
    await placeWith("USED1");
    renderWithProviders(<AdminCouponsPage />);
    await screen.findByRole("table", { name: "Coupons" });

    const del = screen.getByRole("button", { name: "Delete USED1" });
    expect(del).toBeDisabled();
    expect(del).toHaveAccessibleDescription("Can't delete: it was used in 1 order. Deactivate it instead.");
    expect(within(rowFor("USED1")).getAllByRole("cell")[2]).toHaveTextContent("1");
  });

  it("shows the 409 message if an order uses the coupon between loading the list and confirming delete", async () => {
    createCoupon({ code: "LATE1", percentOff: 10 });
    renderWithProviders(<AdminCouponsPage />);
    await screen.findByRole("table", { name: "Coupons" });
    await userEvent.click(screen.getByRole("button", { name: "Delete LATE1" }));

    await placeWith("LATE1"); // used after the page already loaded
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete coupon" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/LATE1 wasn't deleted: it was used in 1 order/i);
    expect(getCouponById(listCoupons().find((c) => c.code === "LATE1")!.id)).toBeDefined();
  });

  it("shows a human-readable error and recovers on retry", async () => {
    const mod = await import("../../services/catalog/couponStore");
    const real = mod.listCoupons;
    let calls = 0;
    const spy = vi.spyOn(mod, "listCoupons").mockImplementation(() => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return real();
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(<AdminCouponsPage />);
    expect(await screen.findByText("We couldn't load coupons right now.")).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("table", { name: "Coupons" })).toBeInTheDocument();

    spy.mockRestore();
    consoleSpy.mockRestore();
  });
});
