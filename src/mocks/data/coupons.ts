export interface Coupon {
  code: string;
  percentOff: number;
  description: string;
}

export const coupons: Coupon[] = [
  { code: "SAVE10", percentOff: 10, description: "10% off your order" },
  { code: "WELCOME15", percentOff: 15, description: "15% off — welcome gift" },
];
