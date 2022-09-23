import AppLayout from "../src/layout/AppLayout"
import {ContractContextData, useContractContext} from "../src/contexts/ContractContext";
import {useEffect, useMemo, useState} from "react";
import {useWeb3React} from "@web3-react/core";
import {BigNumber} from "@ethersproject/bignumber";
import {ColumnsType} from "antd/es/table";
import {Button, Col, Modal, Row, Skeleton, Table, Typography} from "antd";
import {DataType} from "csstype";
import {tokenIcons} from "../src/constants/Images";
import {Erc20Token} from "@dany-armstrong/hardhat-erc20";
import {formatPrice} from "../src/utils/PriceUtil";
import {FAUCET_MINT_AMOUNT} from "../src/constants/Prices";

interface DataType {
    key: string;
    name: string;
    symbol: string;
    decimals: number;
    price: BigNumber,
    balance: BigNumber;
    icon: any;
    token: Erc20Token;
}

export default function Faucet() {
    const {account, library} = useWeb3React();
    const {cTokenUnderlyings, cTokenUnderlyingPrices}: ContractContextData = useContractContext();
    const [tokenData, setTokenData] = useState<DataType[]>([]);
    const [lastMintTxResult, setLastMintTxResult] = useState(null);

    const [lastMintToken, setLastMintToken] = useState(null);
    const [openMintModal, setOpenMintModal] = useState(false);
    const [minting, setMinting] = useState(false);

    const onMint = async (record: DataType) => {
        setLastMintToken(record);
        setOpenMintModal(true);
    };

    const onMintModalOk = async () => {
        setMinting(true);

        try {
            const tx = await lastMintToken.token.connect(library.getSigner()).mint(account,
                FAUCET_MINT_AMOUNT.mul(BigNumber.from(10).pow(lastMintToken.decimals)));
            const result = await tx.wait();
            setLastMintTxResult(result);
        } catch (e) {
            alert("Operation failed.");
        }

        setMinting(false);
        setOpenMintModal(false);
    }

    const columns: ColumnsType<DataType> = useMemo(() => [
        {
            title: 'Asset',
            key: 'asset',
            render: (_, record) => (
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
            title: 'Token Price',
            key: 'token price',
            render: (_, record) => (
                <div><span>${formatPrice(record.price, 18)}</span></div>
            ),
        },
        {
            title: 'Token Address',
            key: 'token address',
            render: (_, record) => (
                <div><span>{record.key}</span></div>
            ),
        },
        {
            title: 'Wallet Balance',
            key: 'wallet balance',
            render: (_, record) => (
                <div><span>{record.balance.div(
                    BigNumber.from(10).pow(record.decimals)).toString()}</span></div>
            ),
        },
        {
            title: 'Faucet',
            key: 'faucet',
            render: (_, record) => (
                <Button onClick={() => {
                    onMint(record)
                }}>Faucet</Button>
            ),
        }
    ], []);

    useEffect(() => {
        (async () => {
            if (cTokenUnderlyings != null) {
                const tokens = await Promise.all(Object.keys(cTokenUnderlyings).map(cToken => {
                    const cTokenUnderlying = cTokenUnderlyings[cToken];
                    return (async () => {
                        const tokenName = await cTokenUnderlying.name();
                        const tokenSymbol = await cTokenUnderlying.symbol();
                        const token: DataType = {
                            key: cToken,
                            name: tokenName,
                            symbol: tokenSymbol,
                            decimals: await cTokenUnderlying.decimals(),
                            price: cTokenUnderlyingPrices[cToken],
                            balance: await cTokenUnderlying.balanceOf(account),
                            icon: tokenIcons[tokenSymbol.toLowerCase()],
                            token: cTokenUnderlying
                        };
                        return token;
                    })();
                }));
                setTokenData(tokens);
            }
        })();
    }, [cTokenUnderlyings, lastMintTxResult]);

    return (
        <>
            <AppLayout>
                <Row style={{paddingTop: 50}} justify="center">
                    <Col style={{width: '1200px'}}>
                        <Typography.Title level={3}>All Assets</Typography.Title>
                        {tokenData.length > 0 ?
                            <Table columns={columns} dataSource={tokenData}/>
                            :
                            <Skeleton/>}
                    </Col>
                </Row>
            </AppLayout>

            {lastMintToken != null &&
                <Modal
                    title={`Faucet ${lastMintToken.symbol}`}
                    open={openMintModal}
                    onOk={onMintModalOk}
                    confirmLoading={minting}
                    onCancel={() => setOpenMintModal(false)}
                >
                  <p>Transaction Overview</p>
                  Amount: {FAUCET_MINT_AMOUNT.toNumber().toFixed(2)} {lastMintToken.symbol}
                </Modal>
            }
        </>
    )
}
