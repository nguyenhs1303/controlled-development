export interface PricingStrategy {
  calculate(subtotal: number): number;
}

export class StandardPricing implements PricingStrategy {
  calculate(subtotal: number): number {
    return subtotal;
  }
}

export class MemberPricing implements PricingStrategy {
  calculate(subtotal: number): number {
    return subtotal * 0.9;
  }
}
