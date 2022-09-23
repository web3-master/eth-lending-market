import AppLayout from "../src/layout/AppLayout"
import {Breadcrumb, Button, Card, Col, Progress, Row, Skeleton, Tooltip} from "antd";
import {useWeb3React} from "@web3-react/core";
import {ContractContextData, useContractContext} from "../src/contexts/ContractContext";
import {useRouter} from "next/router";
import React, {useEffect, useState} from "react";
import {CTokenLike, InterestRateModel__factory} from "@dany-armstrong/hardhat-compound";
import {BigNumber} from "@ethersproject/bignumber";
import {Erc20Token} from "@dany-armstrong/hardhat-erc20";
import {
    formatPrice,
    getRatePerYear,
    getTotalBorrowInUSD,
    getTotalSupplyInUnderlyingToken,
    getTotalSupplyInUSD,
    getUnderlyingTokenPerCToken,
} from "../src/utils/PriceUtil";
import {tokenIcons} from "../src/constants/Images";
import {ETH_NAME, ETH_SYMBOL, ETH_TOKEN_ADDRESS} from "../src/constants/Network";
import TokenProperty from "../src/components/TokenProperty";
import Link from "next/link";
import {ParentSize} from "@visx/responsive";
import InterestModelChart from "../src/components/InterestModelChart";
import {SearchOutlined} from "@ant-design/icons";
import {getExplorerLinkWithChainIdAndAddress} from "../src/utils/NetworkUtil";
import {
    CErc20,
    CErc20Delegator,
    CErc20Immutable
} from "@dany-armstrong/hardhat-compound/dist/typechain";
import {Mantissa} from "../src/constants/Prices";

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
    cTokenMinted: string;
    underlyingTokensPerCToken: number;
}

export interface Rate {
    utilization: number;
    supply: number;
    borrow: number;
}

export default function Market() {
    const router = useRouter();
    const {library, chainId} = useWeb3React();
    const [cToken, setCToken] = useState<CTokenLike>();
    const [cTokenInfo, setCTokenInfo] = useState<CTokenInfo>();
    const {
        cTokens,
        cTokenUnderlyings,
        cTokenUnderlyingPrices,
        comptroller
    }: ContractContextData = useContractContext();
    const [rates, setRates] = useState<Rate[]>();
    const [rateCalculationProgress, setRateCalculationProgress] = useState(0);
    const [currentUtilizationRate, setCurrentUtilizationRate] = useState(0);
    const cTokenAddress = router.query.cToken;

    useEffect(() => {
        if (cTokens != null) {
            const result = cTokens.find((value: CTokenLike) => value.address == cTokenAddress);
            setCToken(result);
        }
    }, [cTokens]);

    const calcRates = async () => {
        let rates: Rate[] = [];
        const b = 1000.0;
        const address = await cToken.interestRateModel();
        const interestRateModel = InterestRateModel__factory.connect(address, library);

        for (var util = 0; util <= 100; util += 5) {
            const rate: Rate = {utilization: 0, borrow: 0, supply: 0};
            const c = (b * 100 / util) - b;
            rate.utilization = util;
            if (util == 0) {
                const borrowRatePerBlock = await interestRateModel.getBorrowRate(0, 0, 0);
                rate.borrow = getRatePerYear(borrowRatePerBlock);
                const supplyRatePerBlock = await interestRateModel.getSupplyRate(0, 0, 0, 0);
                rate.supply = getRatePerYear(supplyRatePerBlock);
            } else {
                const borrowRatePerBlock = await interestRateModel.getBorrowRate(c.toFixed(),
                    b.toFixed(), 0);
                rate.borrow = getRatePerYear(borrowRatePerBlock);
                const supplyRatePerBlock = await interestRateModel.getSupplyRate(c.toFixed(),
                    b.toFixed(), 0, 0);
                rate.supply = getRatePerYear(supplyRatePerBlock);
            }
            rates.push(rate);
            setRateCalculationProgress(util);
        }

        setRates(rates);
    }

    useEffect(() => {
        if (cToken != null && cTokenUnderlyings != null) {
            (async () => {
                const isErc20 = cToken.hasOwnProperty("underlying");

                const underlyingAddress = isErc20
                    ? await (cToken as CErc20 | CErc20Immutable | CErc20Delegator).underlying()
                    : ETH_TOKEN_ADDRESS;
                const cTokenUnderlying = isErc20 ? cTokenUnderlyings[underlyingAddress] : null;
                const decimals = isErc20 ? await cTokenUnderlying.decimals() : 18;
                const cTokenDecimals = isErc20 ? await cToken.decimals() : 18;
                const tokenName = isErc20 ? await cTokenUnderlying.name() : ETH_NAME;
                const tokenSymbol = isErc20 ? await cTokenUnderlying.symbol() : ETH_SYMBOL;
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
                const marketLiquidity = getTotalSupplyInUnderlyingToken(
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
                    cTokenMinted: formatPrice(totalSupplyInCToken, cTokenDecimals),
                    underlyingTokensPerCToken: getUnderlyingTokenPerCToken(exchangeRate,
                        cTokenDecimals, decimals),
                };
                setCTokenInfo(tokenInfo);

                const cashMantissa = await cToken.getCash();
                const utilizationRate = cashMantissa.eq(0) && totalBorrowInUnderlyingToken.eq(0) ? 0
                    : totalBorrowInUnderlyingToken.mul(100 * 10).div(
                    cashMantissa.add(totalBorrowInUnderlyingToken)).toNumber() / 10;
                setCurrentUtilizationRate(utilizationRate);
            })();
            calcRates();
        }
    }, [cToken, cTokenUnderlyings])

    const interestModelChart = () => {
        return <Card title="Interest Rate Model">
            {rates != null ?
                <div style={{width: '100%', height: 300}}>
                    <ParentSize>
                        {(parent) => (
                            <InterestModelChart width={parent.width} height={parent.height}
                                                rates={rates}
                                                currentUtilizationRate={currentUtilizationRate}/>
                        )}
                    </ParentSize>
                </div> :
                <div>
                    <Progress
                        percent={rateCalculationProgress} style={{marginBottom: 20}}/>
                    <Skeleton/>
                </div>}
        </Card>
    }

    const marketDetailRow = (label, value) => {
        return <Row justify="space-between" style={{marginTop: 20, marginBottom: 20}}>
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
                            "$" + formatPrice(cTokenInfo.price, 18))}
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
                        {marketDetailRow("c" + cTokenInfo.symbol,
                            cTokenInfo.cTokenMinted)}
                        {marketDetailRow("Exchange Rate",
                            `1 c${cTokenInfo.symbol} = ${cTokenInfo.underlyingTokensPerCToken.toLocaleString()} ${cTokenInfo.symbol}`)}
                    </>
                    : <Skeleton/>}
            </Card>
        );
    }

    const onViewContract = () => {
        let link = getExplorerLinkWithChainIdAndAddress(chainId, cToken.address);
        if (link != null) {
            window.open(link);
        }
    }

    return (
        <AppLayout>
            <Row style={{paddingTop: 50}} justify="center">
                <Col style={{width: '1200px'}}>
                    {cTokenInfo != null &&
                        <Breadcrumb>
                          <Breadcrumb.Item><Link href="/markets">Markets</Link></Breadcrumb.Item>
                          <Breadcrumb.Item>{cTokenInfo.symbol}</Breadcrumb.Item>
                        </Breadcrumb>
                    }

                    <br/>
                    <br/>

                    {cTokenInfo != null ?
                        <Row justify="space-between">
                            <Col>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                }}>
                                    <img src={cTokenInfo.icon.src} alt='icon' width={40}/>
                                    <div style={{marginLeft: 10, marginRight: 10}}>
                                        <span style={{fontSize: 40}}>{cTokenInfo.name}</span>
                                    </div>
                                    <Tooltip title="View token contract on etherscan">
                                        <Button size="small" shape="circle" icon={<SearchOutlined/>}
                                                onClick={() => onViewContract()}
                                                style={{marginTop: 10}}/>
                                    </Tooltip>
                                </div>
                            </Col>
                            <Col>
                                <Row gutter={40}>
                                    <Col>
                                        <TokenProperty label="Total Supply"
                                                       value={cTokenInfo.totalSupply} prefix="$"
                                                       suffix={null}/>
                                    </Col>
                                    <Col>
                                        <TokenProperty label="Supply APY"
                                                       value={cTokenInfo.supplyApy}
                                                       prefix={null} suffix="%"/>
                                    </Col>
                                    <Col>
                                        <TokenProperty label="Total Borrow"
                                                       value={cTokenInfo.totalBorrow} prefix="$"
                                                       suffix={null}/>
                                    </Col>
                                    <Col>
                                        <TokenProperty label="Borrow APY"
                                                       value={cTokenInfo.borrowApy}
                                                       prefix={null} suffix="%"/>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        : <Skeleton/>}

                    <br/>
                    <br/>

                    <Row gutter={40}>
                        <Col span={12}>
                            {interestModelChart()}
                        </Col>
                        <Col span={12}>
                            {marketDetailInformation()}
                        </Col>
                    </Row>
                </Col>
            </Row>
        </AppLayout>
    )
}
