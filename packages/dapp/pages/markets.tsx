import AppLayout from "../src/layout/AppLayout"
import {ContractContextData, useContractContext} from "../src/contexts/ContractContext";
import {useEffect, useMemo, useState} from "react";
import {useWeb3React} from "@web3-react/core";
import {BigNumber} from "@ethersproject/bignumber";
import {ColumnsType} from "antd/es/table";
import {Button, Table, Typography} from "antd";
import {DataType} from "csstype";
import {tokenIcons} from "../src/constants/Images";
import {Erc20Token} from "@dany-armstrong/hardhat-erc20";
import {formatPrice, getTotalSupplyInUSD} from "../src/utils/PriceUtil";
import {ETH_TOKEN_ADDRESS} from "../src/constants/Network";
import {parseUnits} from "ethers/lib/utils";
import {CTokenLike} from "@dany-armstrong/hardhat-compound";

interface DataType {
    key: CTokenLike;
    name: string;
    symbol: string;
    decimals: number;
    price: BigNumber,
    totalSupply: BigNumber;
    supplyApy: BigNumber;
    totalBorrow: BigNumber;
    borrowApy: BigNumber;
    icon: any;
    token: Erc20Token;
}

export default function Markets() {
    const {active, account, activate, library, connector} = useWeb3React();
    const {
        cTokens,
        cTokenUnderlyings,
        cTokenUnderlyingPrices,
        comptroller
    }: ContractContextData = useContractContext();
    const [tokenData, setTokenData] = useState<DataType[]>([]);
    // const [lastMintTxResult, setLastMintTxResult] = useState(null);

    // const [lastMintToken, setLastMintToken] = useState(null);
    // const [openMintModal, setOpenMintModal] = useState(false);
    // const [minting, setMinting] = useState(false);
    //
    // const onMint = async (record: DataType) => {
    //     setLastMintToken(record);
    //     setOpenMintModal(true);
    // };
    //
    // const onMintModalOk = async () => {
    //     setMinting(true);
    //
    //     const tx = await lastMintToken.token.connect(library.getSigner()).mint(account,
    //         BigNumber.from(10).mul(BigNumber.from(10).pow(lastMintToken.decimals)));
    //     const result = await tx.wait();
    //     setLastMintTxResult(result);
    //
    //     setMinting(false);
    //     setOpenMintModal(false);
    // }

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
        await tx.wait();
    };

    const onBorrow = async (record: DataType) => {
        const signer = library.getSigner();
        const cToken: CTokenLike = record.key;
        const borrowAmount = parseUnits("300", record.decimals); // supply 4 UNI

        const isEntered = await comptroller.checkMembership(account, cToken.address);

        let tx;
        if (!isEntered) {
            tx = await comptroller.connect(signer).enterMarkets([cToken.address]);
            await tx.wait();
        }

        tx = await cToken.connect(signer).borrow(borrowAmount);
        await tx.wait();
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
                <div><span>${record.totalSupply.toString()}</span></div>
            ),
        },
        {
            title: 'Supply APY',
            key: 'supply apy',
            render: (_, record) => (
                <div><span>{formatPrice(record.supplyApy, 18)}</span></div>
            ),
        },
        {
            title: 'Total Borrow',
            key: 'total borrow',
            render: (_, record) => (
                <div><span>${formatPrice(record.totalBorrow, 18)}</span></div>
            ),
        },
        {
            title: 'Borrow APY',
            key: 'borrow apy',
            render: (_, record) => (
                <div><span>{formatPrice(record.borrowApy, 18)}</span></div>
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
                            const token: DataType = {
                                key: cToken,
                                name: tokenName,
                                symbol: tokenSymbol,
                                decimals: decimals,
                                price: underlyingPrice,
                                totalSupply: totalSupplyInUSD,
                                supplyApy: await cToken.supplyRatePerBlock(),
                                totalBorrow: await cToken.totalBorrows(),
                                borrowApy: await cToken.borrowRatePerBlock(),
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
                            const token: DataType = {
                                key: cToken,
                                name: tokenName,
                                symbol: tokenSymbol,
                                decimals: 18,
                                price: underlyingPrice,
                                totalSupply: totalSupplyInUSD,
                                supplyApy: await cToken.supplyRatePerBlock(),
                                totalBorrow: await cToken.totalBorrows(),
                                borrowApy: await cToken.borrowRatePerBlock(),
                                icon: tokenIcons[tokenSymbol.toLowerCase()],
                                token: null
                            };
                            return token;
                        }
                    })();
                }));
                setTokenData(tokens);
            }
        })();
    }, [cTokens, cTokenUnderlyings]);

    return (
        <>
            <AppLayout>
                <div style={{padding: '50px 200px'}}>
                    <Typography.Title level={5}>All markets</Typography.Title>
                    <br/>
                    <Table columns={columns} dataSource={tokenData}
                           rowKey={(record: DataType) => record.key.address}/>
                </div>
            </AppLayout>
        </>
    )
}
