import AppLayout from "../src/layout/AppLayout"
import {ContractContextData, useContractContext} from "../src/contexts/ContractContext";
import React, {useEffect, useMemo, useState} from "react";
import {useWeb3React} from "@web3-react/core";
import {ColumnsType} from "antd/es/table";
import {Button, Col, Row, Skeleton, Table, Typography} from "antd";
import {DataType} from "csstype";
import {tokenIcons} from "../src/constants/Images";
import {Erc20Token} from "@dany-armstrong/hardhat-erc20";
import {
    getRatePerYear,
    getTotalBorrowInUSD,
    getTotalSupplyInUSD,
    Mantissa
} from "../src/utils/PriceUtil";
import {ETH_NAME, ETH_SYMBOL, ETH_TOKEN_ADDRESS} from "../src/constants/Network";
import {CTokenLike} from "@dany-armstrong/hardhat-compound";
import {useRouter} from "next/router";
import TokenProperty from "../src/components/TokenProperty";
import {
    CErc20,
    CErc20Delegator,
    CErc20Immutable
} from "@dany-armstrong/hardhat-compound/dist/typechain";
import SupplyModal from "../src/components/modals/SupplyModal";
import {BigNumber} from "@ethersproject/bignumber";
import BorrowModal from "../src/components/modals/BorrowModal";
import WithdrawModal from "../src/components/modals/WithdrawModal";

export interface DataType {
    key: CTokenLike;
    name: string;
    symbol: string;
    decimals: number;
    underlyingPrice: BigNumber;
    totalSupply: number;
    supplyApy: number;
    totalBorrow: number;
    borrowApy: number;
    icon: any;
    token: Erc20Token;
}

export default function Dashboard() {
    const router = useRouter();
    const {active, account, activate, library, connector} = useWeb3React();
    const {
        myCTokens,
        reloadMyCTokens,
        cTokens,
        cTokenUnderlyings,
        cTokenUnderlyingPrices,
        comptroller
    }: ContractContextData = useContractContext();
    const [tokenData, setTokenData] = useState<DataType[]>([]);
    const [totalSupply, setTotalSupply] = useState(0);
    const [totalBorrow, setTotalBorrow] = useState(0);
    const [collateral, setCollateral] = useState(0);
    const [lastTxResult, setLastTxResult] = useState(null);
    const [mySupplyTokenData, setMySupplyTokenData] = useState<DataType[]>([]);
    const [myBorrowTokenData, setMyBorrowTokenData] = useState<DataType[]>([]);
    const [lastCTokenData, setLastCTokenData] = useState<DataType>();
    const [showSupplyModal, setShowSupplyModal] = useState(false);
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    const columns: ColumnsType<DataType> = useMemo(() => [
        {
            title: 'Asset',
            key: 'asset',
            render: (_, record) => (
                // icon,
                <div style={{display: 'flex', flexDirection: 'row'}}>
                    <img src={record.icon.src} alt='icon' width={40}/>
                    <div style={{marginLeft: 10}}>
                        <Typography.Text strong={true}>{record.symbol}</Typography.Text>
                        <br/>
                        <span>{record.name}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Total Supply',
            key: 'total supply',
            render: (_, record) => (
                <span>${record.totalSupply.toLocaleString()}</span>
            ),
        },
        {
            title: 'Supply APY',
            key: 'supply apy',
            render: (_, record) => (
                <span>{record.supplyApy}%</span>
            ),
        },
        {
            title: 'Total Borrow',
            key: 'total borrow',
            render: (_, record) => (
                <span>${record.totalBorrow.toLocaleString()}</span>
            ),
        },
        {
            title: 'Borrow APY',
            key: 'borrow apy',
            render: (_, record) => (
                <span>{record.borrowApy}%</span>
            ),
        },
        {
            title: 'Supply',
            key: 'supply',
            render: (_, record) => (
                <Button onClick={(event) => {
                    event.stopPropagation();
                    setLastCTokenData(record);
                    setShowSupplyModal(true);
                }}>Supply</Button>
            ),
        },
        {
            title: 'Borrow',
            key: 'borrow',
            render: (_, record) => (
                <Button onClick={(event) => {
                    event.stopPropagation();
                    setLastCTokenData(record);
                    setShowBorrowModal(true);
                }}>Borrow</Button>
            ),
        },
    ], []);

    const mySupplyColumns: ColumnsType<DataType> = useMemo(() => [
        {
            title: 'Asset',
            key: 'asset',
            render: (_, record) => (
                // icon,
                <div style={{display: 'flex', flexDirection: 'row'}}>
                    <img src={record.icon.src} alt='icon' width={40}/>
                    <div style={{marginLeft: 10}}>
                        <Typography.Text strong={true}>{record.symbol}</Typography.Text>
                        <br/>
                        <span>{record.name}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Balance',
            key: 'total supply',
            render: (_, record) => (
                <span>${record.totalSupply.toLocaleString()}</span>
            ),
        },
        {
            title: 'APY',
            key: 'supply apy',
            render: (_, record) => (
                <span>{record.supplyApy}%</span>
            ),
        },
        {
            title: 'Withdraw',
            key: 'withdraw',
            render: (_, record) => (
                <Button onClick={(event) => {
                    event.stopPropagation();
                    setLastCTokenData(record);
                    setShowWithdrawModal(true);
                }}>Withdraw</Button>
            ),
        },
    ], []);

    const myBorrowColumns: ColumnsType<DataType> = useMemo(() => [
        {
            title: 'Asset',
            key: 'asset',
            render: (_, record) => (
                // icon,
                <div style={{display: 'flex', flexDirection: 'row'}}>
                    <img src={record.icon.src} alt='icon' width={40}/>
                    <div style={{marginLeft: 10}}>
                        <Typography.Text strong={true}>{record.symbol}</Typography.Text>
                        <br/>
                        <span>{record.name}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Balance',
            key: 'total borrow',
            render: (_, record) => (
                <span>${record.totalBorrow.toLocaleString()}</span>
            ),
        },
        {
            title: 'APY',
            key: 'borrow apy',
            render: (_, record) => (
                <span>{record.borrowApy}%</span>
            ),
        },
        {
            title: 'Replay',
            key: 'replay',
            render: (_, record) => (
                <Button onClick={(event) => {
                    event.stopPropagation();
                }}>Replay</Button>
            ),
        },
    ], []);

    const getTotalSupplyAndBorrow = (tokens: DataType[]): [number, number] => {
        let totalSupply = 0;
        let totalBorrow = 0;
        tokens.forEach((value: DataType) => {
            totalSupply += value.totalSupply;
            totalBorrow += value.totalBorrow;
        });
        return [totalSupply, totalBorrow];
    }

    useEffect(() => {
        (async () => {
            if (cTokenUnderlyings != null && cTokens != null) {
                const tokens = await Promise.all(cTokens.map(cToken => {
                    return (async () => {
                        const isErc20 = cToken.hasOwnProperty("underlying");
                        const underlyingAddress = isErc20
                            ? await (cToken as CErc20 | CErc20Immutable | CErc20Delegator).underlying()
                            : ETH_TOKEN_ADDRESS;
                        const cTokenUnderlying = isErc20 ? cTokenUnderlyings[underlyingAddress]
                            : null;
                        const decimals = isErc20 ? await cTokenUnderlying.decimals() : 18;
                        const tokenName = isErc20 ? await cTokenUnderlying.name() : ETH_NAME;
                        const tokenSymbol = isErc20 ? await cTokenUnderlying.symbol() : ETH_SYMBOL;
                        const totalSupplyInCToken = await cToken.totalSupply();
                        const cTokenDecimals = await cToken.decimals();
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
                        const token: DataType = {
                            key: cToken,
                            name: tokenName,
                            symbol: tokenSymbol,
                            decimals: decimals,
                            underlyingPrice: underlyingPrice,
                            totalSupply: totalSupplyInUSD.toNumber(),
                            supplyApy: getRatePerYear(await cToken.supplyRatePerBlock()),
                            totalBorrow: totalBorrowInUSD.toNumber(),
                            borrowApy: getRatePerYear(await cToken.borrowRatePerBlock()),
                            icon: tokenIcons[tokenSymbol.toLowerCase()],
                            token: cTokenUnderlying
                        };
                        return token;
                    })();
                }));
                setTokenData(tokens);

                const myCTokenData = await Promise.all(myCTokens.map(cToken => {
                    return (async () => {
                        const isErc20 = cToken.hasOwnProperty("underlying");
                        const underlyingAddress = isErc20
                            ? await (cToken as CErc20 | CErc20Immutable | CErc20Delegator).underlying()
                            : ETH_TOKEN_ADDRESS;
                        const cTokenUnderlying = isErc20 ? cTokenUnderlyings[underlyingAddress]
                            : null;
                        const decimals = isErc20 ? await cTokenUnderlying.decimals() : 18;
                        const tokenName = isErc20 ? await cTokenUnderlying.name() : ETH_NAME;
                        const tokenSymbol = isErc20 ? await cTokenUnderlying.symbol() : ETH_SYMBOL;
                        const accountSnapshot = await cToken.getAccountSnapshot(account);
                        const totalSupplyInCToken = accountSnapshot[1];
                        const exchangeRate = accountSnapshot[3];
                        const underlyingPrice = cTokenUnderlyingPrices[underlyingAddress];
                        const totalSupplyInUSD = getTotalSupplyInUSD(
                            totalSupplyInCToken,
                            decimals,
                            exchangeRate,
                            underlyingPrice
                        );
                        const totalBorrowInUnderlyingToken = accountSnapshot[2];
                        const totalBorrowInUSD = getTotalBorrowInUSD(
                            totalBorrowInUnderlyingToken,
                            decimals,
                            underlyingPrice
                        );
                        const token: DataType = {
                            key: cToken,
                            name: tokenName,
                            symbol: tokenSymbol,
                            decimals: decimals,
                            underlyingPrice: underlyingPrice,
                            totalSupply: totalSupplyInUSD.toNumber(),
                            supplyApy: getRatePerYear(await cToken.supplyRatePerBlock()),
                            totalBorrow: totalBorrowInUSD.toNumber(),
                            borrowApy: getRatePerYear(await cToken.borrowRatePerBlock()),
                            icon: tokenIcons[tokenSymbol.toLowerCase()],
                            token: cTokenUnderlying
                        };
                        return token;
                    })();
                }));

                const mySupplyTokenData = myCTokenData.filter((cTokenData) => {
                    return cTokenData.totalSupply > 0;
                });
                setMySupplyTokenData(mySupplyTokenData);

                const myBorrowTokenData = myCTokenData.filter((cTokenData) => {
                    return cTokenData.totalBorrow > 0;
                })
                setMyBorrowTokenData(myBorrowTokenData);

                const [supply, borrow] = getTotalSupplyAndBorrow(myCTokenData);
                setTotalSupply(supply);
                setTotalBorrow(borrow);

                const accountLiquidity = await comptroller.getAccountLiquidity(account);
                const liquidity = accountLiquidity[1].div(Mantissa).toNumber();
                const shortfall = accountLiquidity[2].div(Mantissa).toNumber();
                if (liquidity > 0) {
                    setCollateral(borrow + liquidity);
                } else if (shortfall > 0) {
                    setCollateral(borrow - shortfall);
                }
            }
        })();
    }, [myCTokens, cTokens, cTokenUnderlyings, lastTxResult]);

    const mySupplies = () => {
        return <Table columns={mySupplyColumns}
                      dataSource={mySupplyTokenData}
                      pagination={false}
                      rowKey={(record: DataType) => record.key.address}
                      onRow={(record: DataType, rowIndex: number) => {
                          return {
                              onClick: event => {
                                  router.push(`/market?cToken=${record.key.address}`)
                              }
                          };
                      }}
        />
    }

    const myBorrows = () => {
        return <Table columns={myBorrowColumns}
                      dataSource={myBorrowTokenData}
                      pagination={false}
                      rowKey={(record: DataType) => record.key.address}
                      onRow={(record: DataType, rowIndex: number) => {
                          return {
                              onClick: event => {
                                  router.push(`/market?cToken=${record.key.address}`)
                              }
                          };
                      }}
        />
    }

    return (
        <>
            <AppLayout>
                <Row style={{paddingTop: 50}} justify="center">
                    <Col style={{width: '1200px'}}>
                        <Typography.Title level={3}>Your Overview</Typography.Title>
                        <Row gutter={40}>
                            <Col>
                                <TokenProperty label="Total Supply" value={totalSupply}
                                               prefix="$" suffix=""/>
                            </Col>
                            <Col>
                                <TokenProperty label="Total Borrow"
                                               value={totalBorrow} prefix="$"
                                               suffix={null}/>
                            </Col>
                            <Col>
                                <TokenProperty label="Collateral"
                                               value={collateral} prefix="$"
                                               suffix={null}/>
                            </Col>
                        </Row>

                        <br/>
                        <br/>

                        <Row gutter={40}>
                            <Col span={12}>
                                <Typography.Title level={3}>Your Supplies</Typography.Title>
                                {mySupplies()}
                            </Col>
                            <Col span={12}>
                                <Typography.Title level={3}>Your Borrows</Typography.Title>
                                {myBorrows()}
                            </Col>
                        </Row>

                        <br/>
                        <br/>

                        <Typography.Title level={3}>All Markets</Typography.Title>
                        {tokenData.length > 0 ?
                            <Table columns={columns} dataSource={tokenData}
                                   rowKey={(record: DataType) => record.key.address}
                                   onRow={(record: DataType, rowIndex: number) => {
                                       return {
                                           onClick: event => {
                                               router.push(`/market?cToken=${record.key.address}`)
                                           }
                                       };
                                   }}
                            />
                            : <Skeleton/>
                        }
                    </Col></Row>
            </AppLayout>
            {showSupplyModal &&
                <SupplyModal cTokenData={lastCTokenData}
                             onClose={(result) => {
                                 if (result != null) {
                                     setLastTxResult(result);
                                     reloadMyCTokens();
                                 }
                                 setShowSupplyModal(false);
                             }
                             }/>
            }
            {showBorrowModal &&
                <BorrowModal cTokenData={lastCTokenData}
                             onClose={(result) => {
                                 if (result != null) {
                                     setLastTxResult(result);
                                     reloadMyCTokens();
                                 }
                                 setShowBorrowModal(false);
                             }
                             }/>
            }
            {showWithdrawModal &&
                <WithdrawModal cTokenData={lastCTokenData}
                             onClose={(result) => {
                                 if (result != null) {
                                     setLastTxResult(result);
                                     reloadMyCTokens();
                                 }
                                 setShowWithdrawModal(false);
                             }
                             }/>
            }
        </>
    )
}
