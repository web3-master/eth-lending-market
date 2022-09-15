import AppLayout from "../src/layout/AppLayout"
import {ContractContextData, useContractContext} from "../src/contexts/ContractContext";
import {useEffect, useMemo, useState} from "react";
import {useWeb3React} from "@web3-react/core";
import {BigNumber} from "@ethersproject/bignumber";
import {ColumnsType} from "antd/es/table";
import {Button, Col, Row, Skeleton, Table, Typography} from "antd";
import {DataType} from "csstype";
import {tokenIcons} from "../src/constants/Images";
import {Erc20Token} from "@dany-armstrong/hardhat-erc20";
import {getRatePerYear, getTotalBorrowInUSD, getTotalSupplyInUSD} from "../src/utils/PriceUtil";
import {ETH_TOKEN_ADDRESS} from "../src/constants/Network";
import {parseUnits} from "ethers/lib/utils";
import {CTokenLike} from "@dany-armstrong/hardhat-compound";
import {useRouter} from "next/router";
import TokenProperty from "../src/components/TokenProperty";

interface DataType {
    key: CTokenLike;
    name: string;
    symbol: string;
    decimals: number;
    price: BigNumber,
    totalSupply: number;
    supplyApy: number;
    totalBorrow: number;
    borrowApy: number;
    icon: any;
    token: Erc20Token;
}

export default function Markets() {
    const router = useRouter();
    const {active, account, activate, library, connector} = useWeb3React();
    const {
        cTokens,
        cTokenUnderlyings,
        cTokenUnderlyingPrices,
        comptroller
    }: ContractContextData = useContractContext();
    const [tokenData, setTokenData] = useState<DataType[]>([]);
    const [totalSupply, setTotalSupply] = useState(0);
    const [totalBorrow, setTotalBorrow] = useState(0);
    const [lastTxResult, setLastTxResult] = useState(null);

    const onSupply = async (record: DataType) => {
        const signer = library.getSigner();
        const cToken: CTokenLike = record.key;
        const uniMintAmount = parseUnits("1000", record.decimals); // supply 4 UNI

        const isEntered = await comptroller.checkMembership(account, cToken.address);

        let tx;
        if (!isEntered) {
            tx = await comptroller.connect(signer).enterMarkets([cToken.address]);
            await tx.wait();
        }

        if (record.token != null) {
            tx = await record.token.connect(signer).approve(cToken.address, uniMintAmount)
            await tx.wait();
        }

        tx = await cToken.connect(signer).mint(uniMintAmount);
        const result = await tx.wait();
        setLastTxResult(result);
    };

    const onBorrow = async (record: DataType) => {
        const signer = library.getSigner();
        const cToken: CTokenLike = record.key;
        const borrowAmount = parseUnits("3", record.decimals); // supply 4 UNI

        const isEntered = await comptroller.checkMembership(account, cToken.address);

        let tx;
        if (!isEntered) {
            tx = await comptroller.connect(signer).enterMarkets([cToken.address]);
            await tx.wait();
        }

        tx = await cToken.connect(signer).borrow(borrowAmount);
        const result = await tx.wait();
        setLastTxResult(result);
    };

    const columns: ColumnsType<DataType> = useMemo(() => [
        {
            title: 'Asset',
            key: 'asset',
            render: (_, record) => (
                // icon,
                <div style={{display: 'flex', flexDirection: 'row'}}>
                    <img src={record.icon.src} alt='icon' width={40}/>
                    <div style={{marginLeft: 10}}>
                    <span><Typography.Text
                        strong={true}>{record.symbol}</Typography.Text></span><br/>
                        <span>{record.name}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Total Supply',
            key: 'total supply',
            render: (_, record) => (
                <div><span>${record.totalSupply.toLocaleString()}</span></div>
            ),
        },
        {
            title: 'Supply APY',
            key: 'supply apy',
            render: (_, record) => (
                <div><span>{record.supplyApy}%</span></div>
            ),
        },
        {
            title: 'Total Borrow',
            key: 'total borrow',
            render: (_, record) => (
                <div><span>${record.totalBorrow.toLocaleString()}</span></div>
            ),
        },
        {
            title: 'Borrow APY',
            key: 'borrow apy',
            render: (_, record) => (
                <div><span>{record.borrowApy}%</span></div>
            ),
        },
        {
            title: 'Supply',
            key: 'supply',
            render: (_, record) => (
                <Button onClick={() => {
                    onSupply(record)
                }}>Supply</Button>
            ),
        },
        {
            title: 'Borrow',
            key: 'borrow',
            render: (_, record) => (
                <Button onClick={() => {
                    onBorrow(record)
                }}>Borrow</Button>
            ),
        },
    ], []);

    const getTotalSupplyAndBorrow = (tokens: DataType[]): [number, number] => {
        let totalSupply = 0;
        let totalBorrow = 0;
        tokens.forEach((value: DataType) => {
            console.log('value', value);
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
                            const token: DataType = {
                                key: cToken,
                                name: tokenName,
                                symbol: tokenSymbol,
                                decimals: decimals,
                                price: underlyingPrice,
                                totalSupply: totalSupplyInUSD.toNumber(),
                                supplyApy: getRatePerYear(await cToken.supplyRatePerBlock()),
                                totalBorrow: totalBorrowInUSD.toNumber(),
                                borrowApy: getRatePerYear(await cToken.borrowRatePerBlock()),
                                icon: tokenIcons[tokenSymbol.toLowerCase()],
                                token: cTokenUnderlying
                            };
                            return token;
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
                            const token: DataType = {
                                key: cToken,
                                name: tokenName,
                                symbol: tokenSymbol,
                                decimals: 18,
                                price: underlyingPrice,
                                totalSupply: totalSupplyInUSD.toNumber(),
                                supplyApy: getRatePerYear(await cToken.supplyRatePerBlock()),
                                totalBorrow: totalBorrowInUSD.toNumber(),
                                borrowApy: getRatePerYear(await cToken.borrowRatePerBlock()),
                                icon: tokenIcons[tokenSymbol.toLowerCase()],
                                token: null
                            };
                            return token;
                        }
                    })();
                }));
                setTokenData(tokens);

                const [supply, borrow] = getTotalSupplyAndBorrow(tokens);
                setTotalSupply(supply);
                setTotalBorrow(borrow);
            }
        })();
    }, [cTokens, cTokenUnderlyings, lastTxResult]);

    return (
        <>
            <AppLayout>
                <Row style={{paddingTop: 50}} justify="center">
                    <Col style={{width: '1200px'}}>
                        <Typography.Title level={3}>Market Overview</Typography.Title>
                            <Row gutter={40}>
                                <Col>
                                    <TokenProperty label="Supply Supply" value={totalSupply}
                                                   prefix="$" suffix=""/>
                                </Col>
                                <Col>
                                    <TokenProperty label="Total Borrow"
                                                   value={totalBorrow} prefix="$"
                                                   suffix={null}/>
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
        </>
    )
}
