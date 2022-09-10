import {
    CErc20Delegator__factory,
    CErc20Immutable__factory,
    CEther__factory,
    Comptroller,
    Comptroller__factory,
    CToken__factory,
    CTokenLike
} from "@dany-armstrong/hardhat-compound";
import React, {PropsWithChildren, useContext, useEffect, useState} from "react";
import {useWeb3React} from "@web3-react/core";
import {ActiveNetwork} from "../constants/Network";
import {CTOKEN} from "@dany-armstrong/hardhat-compound/dist/src/configs";
import {CTokenType} from "@dany-armstrong/hardhat-compound/dist/src/enums";
import {Erc20Token} from "@thenextblock/hardhat-erc20";
import {Erc20Token__factory} from "@thenextblock/hardhat-erc20/dist/typechain";

export interface ContractContextData {
    comptroller: Comptroller;
    cTokens: CTokenLike[];
    cTokenUnderlyings: {[key: string]: Erc20Token};
}

const ContractContext = React.createContext({} as ContractContextData);

export const ContractContextProvider = ({children}: PropsWithChildren<{}>) => {
    const {active, account, activate, chainId, connector, library} = useWeb3React();
    const [comptroller, setComptroller] = useState<Comptroller>();
    const [markets, setMarkets] = useState<CTokenLike[]>();
    const [underlyings, setUnderlyings] = useState<{[key: string]: Erc20Token}>();

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

    const loadCTokenUnderlyings = async (cTokens: CTokenLike[]): Promise<Record<CTokenLike, Erc20Token>> => {
        const underlyings: {[key: string]: Erc20Token} = {};
        await Promise.all(cTokens.map(cToken => {
            return (async () => {
                if (cToken.hasOwnProperty("underlying")) {
                    const underlyingAddress = await cToken.underlying();
                    underlyings[underlyingAddress] = Erc20Token__factory.connect(underlyingAddress, library);
                }
            })();
        }));

        return underlyings;
    }

    useEffect(() => {
        (async () => {
            if (active && chainId == ActiveNetwork) {
                const comptrollerAddressJson = await import(`../contract/${chainId}-comptroller.json`, {assert: {type: "json"}});
                const comptrollerContract = Comptroller__factory.connect(
                    comptrollerAddressJson.address, library);
                setComptroller(comptrollerContract);

                const cTokens = await loadCTokens(comptrollerContract);
                setMarkets(cTokens);

                const cTokenUnderlyings = await loadCTokenUnderlyings(cTokens);
                setUnderlyings(cTokenUnderlyings);
            } else {
                setComptroller(null);
            }
        })();
    }, [active, chainId]);

    return (<ContractContext.Provider value={{
        comptroller: comptroller,
        cTokens: markets,
        cTokenUnderlyings: underlyings
    }}>{children}</ContractContext.Provider>);
}

export const useContractContext = () => useContext(ContractContext);
