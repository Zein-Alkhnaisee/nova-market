export interface ConfiguratorOption {
  id: string;
  label: string;
  /** Added to (or subtracted from) the product's base price when selected. */
  priceDelta: number;
}

export interface ConfiguratorGroup {
  id: string;
  label: string;
  options: ConfiguratorOption[];
}
