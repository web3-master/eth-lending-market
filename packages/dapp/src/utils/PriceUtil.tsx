import {BigNumber} from "@ethersproject/bignumber";

export const Mantissa = BigNumber.from(10).pow(18);

export const formatPrice = (priceInWei: BigNumber, decimals: number) => {
    const price = priceInWei.div(BigNumber.from(10).pow(decimals));
    return price.toNumber().toFixed(2);
};

export const getTotalSupplyInUSD = (cTokenSupply: BigNumber, decimals: number,
    exchangeRate: BigNumber,
    underlyingTokenPrice: BigNumber): BigNumber => {
    const usd = cTokenSupply.mul(exchangeRate.div(Mantissa)).div(BigNumber.from(10).pow(decimals)).mul(
        underlyingTokenPrice.div(Mantissa));
    return usd;
}

export const getTotalBorrowInUSD = (underlyingTokenAmount: BigNumber, decimals: number,
    underlyingTokenPrice: BigNumber): BigNumber => {
    const usd = underlyingTokenAmount.div(BigNumber.from(10).pow(decimals)).mul(
        underlyingTokenPrice.div(Mantissa));
    return usd;
}

export const getRatePerYear = (ratePerBlock: BigNumber): number => {
    const ratePerYear = ratePerBlock.mul(365 * 24 * 3600).div(14).mul(100 * 100).div(Mantissa);
    return ratePerYear.toNumber() / 100;
}
