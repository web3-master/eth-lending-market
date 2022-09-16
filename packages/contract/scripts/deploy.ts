import {ethers} from "hardhat";
import {parseUnits} from "ethers/lib/utils";
import {deployErc20Token, Erc20Token} from "@dany-armstrong/hardhat-erc20";
import {CTokenDeployArg, deployCompoundV2,} from "@dany-armstrong/hardhat-compound";
import {writeFileSync} from 'fs';
import {join} from 'path';

interface UnderlyingTokenInfo {
    name: string;
    symbol: string;
    decimals: number;
    priceInMantissa: string;
}

async function main() {
    const [deployer] = await ethers.getSigners();

    const underlyingTokenInfos: UnderlyingTokenInfo[] = [
        {
            name: "USD Coin",
            symbol: "USDC",
            decimals: 6,
            priceInMantissa: "1000000000000000000"
        },
        {
            name: "Uniswap",
            symbol: "UNI",
            decimals: 18,
            priceInMantissa: "25022748000000000000"
        },
        {
            name: "Aave Token",
            symbol: "AAVE",
            decimals: 18,
            priceInMantissa: "92500000000000000000"
        },
        {
            name: "Dai Token",
            symbol: "DAI",
            decimals: 18,
            priceInMantissa: "1000000000000000000"
        },
        {
            name: "Wrapped BTC",
            symbol: "WBTC",
            decimals: 8,
            priceInMantissa: "19631000000000000000000"
        },
        {
            name: "Maker",
            symbol: "MKR",
            decimals: 18,
            priceInMantissa: "669000000000000000000"
        },
        {
            name: "Basic Attention Token",
            symbol: "BAT",
            decimals: 18,
            priceInMantissa: "320000000000000000"
        },
        {
            name: "Chainlink Token",
            symbol: "LINK",
            decimals: 18,
            priceInMantissa: "7730000000000000000"
        },
        {
            name: "Tether USD",
            symbol: "USDT",
            decimals: 6,
            priceInMantissa: "1000000000000000000"
        },
        {
            name: "0x Token",
            symbol: "ZRX",
            decimals: 18,
            priceInMantissa: "290000000000000000"
        },
    ];

    const underlyingTokens: Erc20Token[] = [];
    for (var i = 0; i < underlyingTokenInfos.length; i++) {
        const underlyingTokenInfo: UnderlyingTokenInfo = underlyingTokenInfos[i];
        const token = await deployErc20Token(
            {
                name: underlyingTokenInfo.name,
                symbol: underlyingTokenInfo.symbol,
                decimals: underlyingTokenInfo.decimals,
            },
            deployer
        );
        console.log(`${underlyingTokenInfo.symbol} token deployed!`);
        underlyingTokens.push(token);
    }

    const ETH_PRICE = "1738000000000000000000";

    const ctokenArgs: CTokenDeployArg[] = underlyingTokens.map((underlyingToken: Erc20Token, index: number) => {
        const underlyingTokenInfo = underlyingTokenInfos[index];
        return {
            cToken: `c${underlyingTokenInfo.symbol}`,
            underlying: underlyingToken.address,
            underlyingPrice: underlyingTokenInfo.priceInMantissa,
            collateralFactor: "500000000000000000", // 50%
        };
    });
    ctokenArgs.push({
        cToken: "cETH",
        underlyingPrice: ETH_PRICE,
        collateralFactor: "500000000000000000", // 50%
    });

    const {comptroller, cTokens, priceOracle, interestRateModels} =
        await deployCompoundV2(ctokenArgs, deployer);

    var tx = await comptroller._setCloseFactor(parseUnits("0.5", 18).toString());
    await tx.wait();

    tx = await comptroller._setLiquidationIncentive(parseUnits("1.08", 18));
    await tx.wait();

    console.log("Comptroller: ", comptroller.address);
    console.log("SimplePriceOralce: ", await comptroller.oracle());

    const chainId = await deployer.getChainId();
    const outputFileName = join(__dirname, `../../dapp/src/contract/${chainId}-comptroller.json`);
    const fileContent = JSON.stringify({
        address: comptroller.address
    });
    writeFileSync(outputFileName, fileContent, {
        flag: 'w',
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
