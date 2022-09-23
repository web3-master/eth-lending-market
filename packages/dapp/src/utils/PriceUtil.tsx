import {BigNumber} from "@ethersproject/bignumber";
import {Mantissa} from "../constants/Prices";

export const formatPrice = (priceInWei: BigNumber, decimals: number) => {
    const price = priceInWei.mul(100).div(BigNumber.from(10).pow(decimals));
    return (price.toNumber() / 100).toFixed(2);
};

export const getTotalSupplyInUSD = (cTokenSupply: BigNumber, underlyingTokenDecimals: number,
    exchangeRateMantissa: BigNumber,
    underlyingTokenPrice: BigNumber): BigNumber => {
    return cTokenSupply.mul(
        exchangeRateMantissa).mul(
        underlyingTokenPrice.div(Mantissa)).div(
        BigNumber.from(10).pow(underlyingTokenDecimals)).div(Mantissa);
}

export const getTotalSupplyInUnderlyingToken = (cTokenSupply: BigNumber,
    underlyingTokenDecimals: number,
    exchangeRateMantissa: BigNumber): number => {
    return cTokenSupply.mul(exchangeRateMantissa).div(
        BigNumber.from(10).pow(underlyingTokenDecimals)).div(Mantissa).toNumber();
}

export const getTotalBorrowInUSD = (underlyingTokenAmount: BigNumber,
    underlyingTokenDecimals: number,
    underlyingTokenPrice: BigNumber): BigNumber => {
    return underlyingTokenAmount.div(BigNumber.from(10).pow(underlyingTokenDecimals)).mul(
        underlyingTokenPrice.div(Mantissa));
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
