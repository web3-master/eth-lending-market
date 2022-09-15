import AppLayout from "../src/layout/AppLayout"
import {Card, Col, Row, Skeleton} from "antd";
import {useWeb3React} from "@web3-react/core";
import {ContractContextData, useContractContext} from "../src/contexts/ContractContext";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {CTokenLike} from "@dany-armstrong/hardhat-compound";
import {BigNumber} from "@ethersproject/bignumber";
import {Erc20Token} from "@dany-armstrong/hardhat-erc20";
import {
    formatPrice,
    getMarketLiquidityInUnderlyingToken,
    getRatePerYear,
    getTotalBorrowInUSD,
    getTotalSupplyInUSD,
    Mantissa
} from "../src/utils/PriceUtil";
import {tokenIcons} from "../src/constants/Images";
import {ETH_TOKEN_ADDRESS} from "../src/constants/Network";
import TokenProperty from "../src/components/TokenProperty";

interface CTokenInfo {
    name: string;
    symbol: string;
    decimals: number;
    price: BigNumber,
    totalSupply: number;
    supplyApy: number;
    totalBorrow: number;
    borrowApy: number;
    icon: any;
    underlyingToken: Erc20Token;

    marketLiquidity: number;
    totalReserves: BigNumber;
    reserveFactor: number;
    collateralFactor: number;
    cTokenMinted: number;
    exchangeRate: BigNumber;
}

export default function Market() {
    const router = useRouter();
    const {active, account, activate, library, connector} = useWeb3React();
    const [cToken, setCToken] = useState<CTokenLike>();
    const [cTokenInfo, setCTokenInfo] = useState<CTokenInfo>();
    const {
        cTokens,
        cTokenUnderlyings,
        cTokenUnderlyingPrices,
        comptroller
    }: ContractContextData = useContractContext();

    const cTokenAddress = router.query.cToken;

    useEffect(() => {
        const result = cTokens.find((value: CTokenLike) => value.address == cTokenAddress);
        setCToken(result);
    }, [cTokens]);

    useEffect(() => {
        if (cToken != null) {
            (async () => {
                if (cToken.hasOwnProperty("underlying")) {
                    const underlyingAddress = await cToken.underlying();
                    const cTokenUnderlying = cTokenUnderlyings[underlyingAddress];
                    const decimals = await cTokenUnderlying.decimals();
                    const tokenName = await cTokenUnderlying.name();
                    const tokenSymbol = await cTokenUnderlying.symbol();
                    const totalSupplyInCToken = await cToken.totalSupply();
                    const exchangeRate = await cToken.exchangeRateStored();
                    const underlyingPrice = cTokenUnderlyingPrices[underlyingAddress];
                    const totalSupplyInUSD = getTotalSupplyInUSD(
                        totalSupplyInCToken,
                        decimals,
                        exchangeRate,
                        underlyingPrice
                    );
                    const totalBorrowInUnderlyingToken = await cToken.totalBorrows();
                    const totalBorrowInUSD = getTotalBorrowInUSD(
                        totalBorrowInUnderlyingToken,
                        decimals,
                        underlyingPrice
                    );
                    const marketLiquidity = getMarketLiquidityInUnderlyingToken(
                        totalSupplyInCToken,
                        decimals,
                        exchangeRate
                    );

                    const reserveFactorMantissa = await cToken.reserveFactorMantissa();
                    const reserveFactor = reserveFactorMantissa.mul(100 * 10).div(
                        Mantissa).toNumber() / 10;

                    const [_, collateralFactorMintissa, __] = await comptroller.markets(cToken.address);
                    const collateralFactor = collateralFactorMintissa.mul(100 * 10).div(
                        Mantissa).toNumber() / 10;
                    const tokenInfo: CTokenInfo = {
                        name: tokenName,
                        symbol: tokenSymbol,
                        decimals: decimals,
                        price: underlyingPrice,
                        totalSupply: totalSupplyInUSD.toNumber(),
                        supplyApy: getRatePerYear(await cToken.supplyRatePerBlock()),
                        totalBorrow: totalBorrowInUSD.toNumber(),
                        borrowApy: getRatePerYear(await cToken.borrowRatePerBlock()),
                        icon: tokenIcons[tokenSymbol.toLowerCase()],
                        underlyingToken: cTokenUnderlying,
                        marketLiquidity: marketLiquidity,
                        totalReserves: await cToken.totalReserves(),
                        reserveFactor: reserveFactor,
                        collateralFactor: collateralFactor,
                        cTokenMinted: totalSupplyInCToken.toNumber(),
                        exchangeRate: exchangeRate,
                    };
                    setCTokenInfo(tokenInfo);
                } else {
                    const underlyingAddress = ETH_TOKEN_ADDRESS;
                    const tokenName = "Ethereum ETH";
                    const tokenSymbol = "ETH";
                    const totalSupplyInCToken = await cToken.totalSupply();
                    const exchangeRate = await cToken.exchangeRateStored();
                    const underlyingPrice = cTokenUnderlyingPrices[underlyingAddress];
                    const totalSupplyInUSD = getTotalSupplyInUSD(
                        totalSupplyInCToken,
                        18,
                        exchangeRate,
                        underlyingPrice
                    );
                    const totalBorrowInUnderlyingToken = await cToken.totalBorrows();
                    const totalBorrowInUSD = getTotalBorrowInUSD(
                        totalBorrowInUnderlyingToken,
                        18,
                        underlyingPrice
                    );
                    const marketLiquidity = getMarketLiquidityInUnderlyingToken(
                        totalSupplyInCToken,
                        18,
                        exchangeRate
                    );

                    const reserveFactorMantissa = await cToken.reserveFactorMantissa();
                    const reserveFactor = reserveFactorMantissa.mul(100 * 10).div(
                        Mantissa).toNumber() / 10;

                    const [_, collateralFactorMintissa, __] = await comptroller.markets(cToken.address);
                    const collateralFactor = collateralFactorMintissa.mul(100 * 10).div(
                        Mantissa).toNumber() / 10;
                    const tokenInfo: CTokenInfo = {
                        name: tokenName,
                        symbol: tokenSymbol,
                        decimals: 18,
                        price: underlyingPrice,
                        totalSupply: totalSupplyInUSD.toNumber(),
                        supplyApy: getRatePerYear(await cToken.supplyRatePerBlock()),
                        totalBorrow: totalBorrowInUSD.toNumber(),
                        borrowApy: getRatePerYear(await cToken.borrowRatePerBlock()),
                        icon: tokenIcons[tokenSymbol.toLowerCase()],
                        underlyingToken: null,
                        marketLiquidity: marketLiquidity,
                        totalReserves: await cToken.totalReserves(),
                        reserveFactor: reserveFactor,
                        collateralFactor: collateralFactor,
                        cTokenMinted: totalSupplyInCToken.toNumber(),
                        exchangeRate: exchangeRate,
                    };
                    setCTokenInfo(tokenInfo);
                }
            })();
        }
    }, [cToken])

    const interestModelChart = () => {
        return <Card title="Interest Model Chart">

        </Card>
    }

    const marketDetailRow = (label, value) => {
        return <Row justify="space-between" style={{marginBottom: 20}}>
            <Col><span style={{color: 'gray'}}>{label}</span></Col>
            <Col><span style={{fontWeight: 'bold'}}>{value}</span></Col>
        </Row>
    }

    const marketDetailInformation = () => {
        return (
            <Card title="Market Details">
                {cTokenInfo != null ?
                    <>
                        {marketDetailRow("Price",
                            "$" + formatPrice(cTokenInfo.price, cTokenInfo.decimals))}
                        {marketDetailRow("Market Liquidity",
                            cTokenInfo.marketLiquidity.toLocaleString() + " " + cTokenInfo.symbol)}
                        {marketDetailRow("Reserves",
                            cTokenInfo.totalReserves.toNumber().toLocaleString()
                            + " "
                            + cTokenInfo.symbol)}
                        {marketDetailRow("Reserve Factor",
                            cTokenInfo.reserveFactor + "%")}
                        {marketDetailRow("Collateral Factor",
                            cTokenInfo.collateralFactor + "%")}
                        {marketDetailRow("c" + cTokenInfo.symbol, cTokenInfo.cTokenMinted.toLocaleString())}
                        {marketDetailRow("Exchange Rate", `1 c${cTokenInfo.symbol} = ${cTokenInfo.exchangeRate.div(Mantissa).toNumber()} ${cTokenInfo.symbol}`)}
                    </>
                    : <Skeleton/>}
            </Card>
        );
    }

    return (
        <AppLayout>
            <Row style={{paddingTop: 50}} justify="center">
                <Col style={{width: '1200px'}}>
                    <Row justify="space-between">
                        <Col>
                            {cTokenInfo != null ?
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                }}>
                                    <img src={cTokenInfo.icon.src} alt='icon' width={40}/>
                                    <div style={{marginLeft: 10}}>
                                        <span style={{fontSize: 40}}>{cTokenInfo.name}</span>
                                    </div>
                                </div> :
                                <Skeleton/>
                            }
                        </Col>
                        <Col>
                            {cTokenInfo != null ?
                                <Row gutter={40}>
                                    <Col>
                                        <TokenProperty label="Total Supply"
                                                       value={cTokenInfo.totalSupply} prefix="$"
                                                       suffix={null}/>
                                    </Col>
                                    <Col>
                                        <TokenProperty label="Supply APY" value={cTokenInfo.supplyApy}
                                                       prefix={null} suffix="%"/>
                                    </Col>
                                    <Col>
                                        <TokenProperty label="Total Borrow"
                                                       value={cTokenInfo.totalBorrow} prefix="$"
                                                       suffix={null}/>
                                    </Col>
                                    <Col>
                                        <TokenProperty label="Borrow APY" value={cTokenInfo.borrowApy}
                                                       prefix={null} suffix="%"/>
                                    </Col>
                                </Row>
                                : <Skeleton/>}
                        </Col>
                    </Row>

                    <br/>

                    <Row gutter={20}>
                        <Col span={12}>
                            {interestModelChart()}
                        </Col>
                        <Col span={12}>
                            {marketDetailInformation()}
                        </Col>
                    </Row>

                </Col>
            </Row>        </AppLayout>
    )
}
