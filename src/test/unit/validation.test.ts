import { describe, expect, it } from "vitest";
import {
  detectCardBrand,
  isValidCardNumber,
  isValidCvc,
  isValidExpiry,
  isValidPhone,
  isValidPostalCode,
} from "../../lib/validation";

describe("checkout validation helpers", () => {
  it("validates postal codes", () => {
    expect(isValidPostalCode("94110")).toBe(true);
    expect(isValidPostalCode("SW1A 1AA")).toBe(true);
    expect(isValidPostalCode("x")).toBe(false);
    expect(isValidPostalCode("")).toBe(false);
  });

  it("validates phone numbers", () => {
    expect(isValidPhone("+1 415 555 0100")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
  });

  it("validates 16-digit card numbers, with or without spaces", () => {
    expect(isValidCardNumber("4242424242424242")).toBe(true);
    expect(isValidCardNumber("4242 4242 4242 4242")).toBe(true);
    expect(isValidCardNumber("4242")).toBe(false);
    expect(isValidCardNumber("42424242424242424242")).toBe(false);
  });

  it("validates expiry in the future", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    const mm = String(future.getMonth() + 1).padStart(2, "0");
    const yy = String(future.getFullYear()).slice(-2);
    expect(isValidExpiry(`${mm}/${yy}`)).toBe(true);
    expect(isValidExpiry("01/20")).toBe(false);
    expect(isValidExpiry("13/30")).toBe(false);
    expect(isValidExpiry("not a date")).toBe(false);
  });

  it("validates 3-4 digit CVC", () => {
    expect(isValidCvc("123")).toBe(true);
    expect(isValidCvc("1234")).toBe(true);
    expect(isValidCvc("12")).toBe(false);
  });

  it("detects card brand by number prefix", () => {
    expect(detectCardBrand("4242424242424242")).toBe("Visa");
    expect(detectCardBrand("5555555555554444")).toBe("Mastercard");
    expect(detectCardBrand("378282246310005")).toBe("Amex");
    expect(detectCardBrand("6011111111111117")).toBe("Card");
  });
});
