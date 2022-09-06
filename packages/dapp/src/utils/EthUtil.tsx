export const DECIMALS = 10 ** 18;

export const ether = (wei) => wei / DECIMALS;

export const formatPrice = (price) => {
  price = ether(price);
  return price;
};
