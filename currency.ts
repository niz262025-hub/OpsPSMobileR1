export const currency = {
  country: 'MY',
  symbol: 'RM',
  code: 'MYR',
  format(value: number) {
    return `${this.symbol}${value.toFixed(2)}`;
  },
};

export function setCountry(country: 'MY' | 'SG') {
  if (country === 'SG') {
    currency.country = 'SG';
    currency.symbol = 'S$';
    currency.code = 'SGD';
  } else {
    currency.country = 'MY';
    currency.symbol = 'RM';
    currency.code = 'MYR';
  }
}
