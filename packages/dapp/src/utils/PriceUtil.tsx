import {BigNumber} from "@ethersproject/bignumber";

export const formatPrice = (priceInWei: BigNumber, decimals: number) => {
    const price = priceInWei.div(BigNumber.from(10).pow(decimals));
    return price.toNumber().toFixed(2);
};
