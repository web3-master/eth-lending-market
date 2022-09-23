import {CTokenLike} from "@dany-armstrong/hardhat-compound";
import {
    CErc20,
    CErc20Delegator,
    CErc20Immutable
} from "@dany-armstrong/hardhat-compound/dist/typechain";
import {ETH_TOKEN_ADDRESS} from "../constants/Network";

export const getShortenAddress = (account) => {
    return account.substring(0, 7) + '...' + account.substring(account.length - 4, account.length);
};

export const getUnderlyingAddress = async (cToken: CTokenLike): Promise<string> => {
    let underlyingAddress;
    if (cToken.hasOwnProperty("underlying")) {
        underlyingAddress =
            await (cToken as CErc20 | CErc20Immutable | CErc20Delegator).underlying();
    } else {
        underlyingAddress = ETH_TOKEN_ADDRESS;
    }
    return underlyingAddress;
}
