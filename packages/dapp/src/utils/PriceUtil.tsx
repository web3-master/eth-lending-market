import {BigNumber} from "@ethersproject/bignumber";

export const Mantissa = BigNumber.from(10).pow(18);

export const formatPrice = (priceInWei: BigNumber, decimals: number) => {
    const price = priceInWei.mul(100).div(BigNumber.from(10).pow(decimals));
    return (price.toNumber() / 100).toFixed(2);
};

export const getTotalSupplyInUSD = (cTokenSupply: BigNumber, underlyingTokenDecimals: number,
    exchangeRate: BigNumber,
    underlyingTokenPrice: BigNumber): BigNumber => {
    const usd = cTokenSupply.mul(
        exchangeRate).mul(
        underlyingTokenPrice.div(Mantissa)).div(
        BigNumber.from(10).pow(underlyingTokenDecimals)).div(Mantissa);
    return usd;
}

export const getMarketLiquidityInUnderlyingToken = (cTokenSupply: BigNumber, decimals: number,
    exchangeRate: BigNumber): number => {
    return cTokenSupply.mul(exchangeRate).div(
        BigNumber.from(10).pow(decimals)).div(Mantissa).toNumber();
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

export const getUnderlyingTokenPerCToken = (exchangeRate: BigNumber, cTokenDecimals: number,
    underlyingDecimals: number): number => {
    const exchangeRatePerCToken = exchangeRate.mul(BigNumber.from(10).pow(cTokenDecimals));
    const underlyingTokenPerCToken = exchangeRatePerCToken.div(
        BigNumber.from(10).pow(underlyingDecimals));
    return underlyingTokenPerCToken.mul(10000).div(Mantissa).toNumber() / 10000;
}
