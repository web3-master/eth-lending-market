import {CTokenLike} from "@dany-armstrong/hardhat-compound";
import {
  CErc20,
  CErc20Delegator,
  CErc20Immutable
} from "@dany-armstrong/hardhat-compound/dist/typechain";
import {Erc20Token__factory} from "@dany-armstrong/hardhat-erc20/dist/typechain";
import {ETH_TOKEN_ADDRESS} from "../constants/Network";
import {ETH_PRICE} from "../constants/Prices";

export const formatAddress = (account) => {
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
