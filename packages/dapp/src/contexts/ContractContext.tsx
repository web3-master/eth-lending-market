import {
    CErc20Delegator__factory,
    CErc20Immutable__factory,
    CEther__factory,
    Comptroller,
    Comptroller__factory,
    CToken__factory,
    CTokenLike,
    SimplePriceOracle,
    SimplePriceOracle__factory
} from "@dany-armstrong/hardhat-compound";
import React, {PropsWithChildren, useContext, useEffect, useState} from "react";
import {useWeb3React} from "@web3-react/core";
import {ActiveNetwork, ETH_TOKEN_ADDRESS} from "../constants/Network";
import {CTOKEN} from "@dany-armstrong/hardhat-compound/dist/src/configs";
import {CTokenType} from "@dany-armstrong/hardhat-compound/dist/src/enums";
import {Erc20Token} from "@dany-armstrong/hardhat-erc20";
import {Erc20Token__factory} from "@dany-armstrong/hardhat-erc20/dist/typechain";
import {BigNumber} from "@ethersproject/bignumber";
import {ETH_PRICE} from "../constants/Prices";

export interface ContractContextData {
    comptroller: Comptroller;
    priceOracle: SimplePriceOracle;
    cTokens: CTokenLike[];
    cTokenUnderlyings: { [key: string]: Erc20Token };
    cTokenUnderlyingPrices: { [key: string]: BigNumber };
}

const ContractContext = React.createContext({} as ContractContextData);

export const ContractContextProvider = ({children}: PropsWithChildren<{}>) => {
    const {active, account, activate, chainId, connector, library} = useWeb3React();
    const [comptroller, setComptroller] = useState<Comptroller>();
    const [priceOracle, setPriceOracle] = useState<SimplePriceOracle>();
    const [markets, setMarkets] = useState<CTokenLike[]>();
    const [underlyings, setUnderlyings] = useState<{ [key: string]: Erc20Token }>();
    const [underlyingPrices, setUnderlyingPrices] = useState<{ [key: string]: BigNumber }>();

    const loadCTokens = async (comptroller: Comptroller): Promise<CTokenLike[]> => {
        const allMarkets: string[] = await comptroller.getAllMarkets();
        const cTokens = allMarkets.map((address) => {
            return CToken__factory.connect(address, library);
        });

        const cTokenLikes: CTokenLike[] = [];
        await Promise.all(cTokens.map(cToken => {
            return (async () => {
                const symbol = await cToken.symbol();
                const cTokenConf = CTOKEN[symbol];
                var cTokenLike = null;
                if (cTokenConf.type === CTokenType.CErc20Delegator) {
                    cTokenLike = CErc20Delegator__factory.connect(cToken.address, library)
                } else if (cTokenConf.type === CTokenType.CErc20) {
                    cTokenLike = CErc20Immutable__factory.connect(cToken.address, library);
                } else if (cTokenConf.type === CTokenType.CEther) {
                    cTokenLike = CEther__factory.connect(cToken.address, library);
                }

                if (cTokenLike != null) {
                    cTokenLikes.push(cTokenLike);
                }
            })();
        }));

        return cTokenLikes;
    }

    const loadCTokenUnderlyings = async (priceOracle: SimplePriceOracle,
        cTokens: CTokenLike[]): Promise<[Record<CTokenLike, Erc20Token>, Record<CTokenLike, BigNumber>]> => {
        const underlyings: { [key: string]: Erc20Token } = {};
        const underlyingPrices: { [key: string]: BigNumber } = {};
        await Promise.all(cTokens.map(cToken => {
            return (async () => {
                let underlyingAddress;
                if (cToken.hasOwnProperty("underlying")) {
                    underlyingAddress = await cToken.underlying();
                    underlyings[underlyingAddress] =
                        Erc20Token__factory.connect(underlyingAddress, library);
                    underlyingPrices[underlyingAddress] =
                        await priceOracle.getUnderlyingPrice(cToken.address);
                } else {
                    underlyingAddress = ETH_TOKEN_ADDRESS;
                    underlyingPrices[underlyingAddress] = ETH_PRICE;
                }
            })();
        }));

        return [underlyings, underlyingPrices];
    }

    useEffect(() => {
        (async () => {
            if (active && chainId == ActiveNetwork) {
                const comptrollerAddressJson = await import(`../contract/${chainId}-comptroller.json`, {assert: {type: "json"}});
                const comptrollerContract = Comptroller__factory.connect(
                    comptrollerAddressJson.address, library);
                setComptroller(comptrollerContract);

                const priceOracleAddress = await comptrollerContract.oracle();
                const priceOracleContract = SimplePriceOracle__factory.connect(priceOracleAddress,
                    library);
                setPriceOracle(priceOracleContract);

                const cTokens = await loadCTokens(comptrollerContract);
                setMarkets(cTokens);

                const [cTokenUnderlyings, cTokenUnderlyingPrices] = await loadCTokenUnderlyings(
                    priceOracleContract,
                    cTokens);
                setUnderlyings(cTokenUnderlyings);
                setUnderlyingPrices(cTokenUnderlyingPrices);
            } else {
                setComptroller(null);
            }
        })();
    }, [active, chainId]);

    return (<ContractContext.Provider value={{
        comptroller: comptroller,
        priceOracle: priceOracle,
        cTokens: markets,
        cTokenUnderlyings: underlyings,
        cTokenUnderlyingPrices: underlyingPrices,
    }}>{children}</ContractContext.Provider>);
}

export const useContractContext = () => useContext(ContractContext);
