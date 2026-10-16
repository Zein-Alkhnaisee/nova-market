import { afterEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import i18n from "../../i18n/config";
import { renderWithProviders } from "../renderWithProviders";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { Footer } from "../../components/layout/Footer";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("NotFoundPage (MASTER_SPEC §84)", () => {
  it("explains what happened and offers back, home and search", () => {
    renderWithProviders(<NotFoundPage />, { route: "/no-such-page" });

    expect(screen.getByRole("heading", { name: "We couldn't find that page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go back" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Search products" })).toHaveAttribute("href", "/search");
  });

  it("is fully translated in Arabic", async () => {
    await i18n.changeLanguage("ar");
    renderWithProviders(<NotFoundPage />, { route: "/no-such-page" });

    expect(screen.getByRole("heading", { name: "لم نتمكن من العثور على هذه الصفحة" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "العودة إلى الرئيسية" })).toHaveAttribute("href", "/");
    expect(screen.queryByText("Back home")).not.toBeInTheDocument();
  });

  it("mirrors the back arrow in RTL", () => {
    renderWithProviders(<NotFoundPage />, { route: "/no-such-page" });
    const arrow = screen.getByRole("button", { name: "Go back" }).querySelector("svg");
    expect(arrow).toHaveClass("rtl:rotate-180");
  });
});

describe("Footer", () => {
  it("translates its column titles and links the destinations that exist", () => {
    renderWithProviders(<Footer />);

    expect(screen.getByText("Shop")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
    expect(screen.getByText("Company")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "New arrivals" })).toHaveAttribute("href", "/new-arrivals");
    expect(screen.getByRole("link", { name: "Trending" })).toHaveAttribute("href", "/trending");
    expect(screen.getByRole("link", { name: "Deals" })).toHaveAttribute("href", "/deals");
    expect(screen.getByRole("link", { name: "Collections" })).toHaveAttribute("href", "/collections");
  });

  it("shows pages that do not exist yet as plain text, not dead links", () => {
    renderWithProviders(<Footer />);

    expect(screen.getByText("Shipping")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Shipping" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Careers" })).not.toBeInTheDocument();
  });

  it("labels the newsletter field instead of relying on its placeholder", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByLabelText("Email address")).toHaveAttribute("type", "email");
  });

  it("shows the current year in the copyright line", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} NOVA Market`))).toBeInTheDocument();
  });

  it("no longer leaks raw translation keys or English in Arabic", async () => {
    await i18n.changeLanguage("ar");
    renderWithProviders(<Footer />);

    expect(screen.getByText("المتجر")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "العروض" })).toHaveAttribute("href", "/deals");
    expect(screen.queryByText("shop")).not.toBeInTheDocument();
    expect(screen.queryByText(/footer\./)).not.toBeInTheDocument();
    expect(screen.queryByText("All rights reserved.", { exact: false })).not.toBeInTheDocument();
  });
});
