import AppLayout from "../src/layout/AppLayout"
import {ContractContextData, useContractContext} from "../src/contexts/ContractContext";
import {useEffect, useState} from "react";
import {useWeb3React} from "@web3-react/core";
import {BigNumber} from "@ethersproject/bignumber";
import {ColumnsType} from "antd/es/table";
import {Button, Table, Typography} from "antd";
import {DataType} from "csstype";
import aave from '../src/images/aave.svg';
import dai from '../src/images/dai.svg';
import eth from '../src/images/eth.svg';
import uni from '../src/images/uni.svg';
import usdc from '../src/images/usdc.svg';

interface DataType {
    key: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: BigNumber;
    icon: any;
}

const columns: ColumnsType<DataType> = [
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
        title: 'Wallet Balance',
        key: 'wallet balance',
        render: (_, record) => (
            <div><span>{record.balance.div(record.decimals).toString()}</span></div>
        ),
    },
    {
        title: 'Faucet',
        key: 'faucet',
        render: (_, record) => (
            <Button onClick={() => {
            }}>Faucet</Button>
        ),
    }
];

const tokenIcons = {
    'aave': aave,
    'dai': dai,
    'eth': eth,
    'uni': uni,
    'usdc': usdc,
};

export default function Faucet() {
    const {active, account, activate} = useWeb3React();
    const {cTokenUnderlyings}: ContractContextData = useContractContext();
    const [tokenData, setTokenData] = useState<DataType[]>([]);

    useEffect(() => {
        (async () => {
            if (cTokenUnderlyings != null) {
                const tokens = await Promise.all(Object.keys(cTokenUnderlyings).map(cToken => {
                    const cTokenUnderlying = cTokenUnderlyings[cToken];
                    return (async () => {
                        const tokenName = await cTokenUnderlying.name();
                        const token: DataType = {
                            key: cToken,
                            name: tokenName,
                            symbol: await cTokenUnderlying.symbol(),
                            decimals: await cTokenUnderlying.decimals(),
                            balance: await cTokenUnderlying.balanceOf(account),
                            icon: tokenIcons[tokenName.toLowerCase()],
                        };
                        return token;
                    })();
                }));
                setTokenData(tokens);
            }
        })();
    }, [cTokenUnderlyings]);

    return (
        <AppLayout>
            <div style={{padding: '50px 200px'}}>
                <Typography.Title level={5}>All assets</Typography.Title>
                <br/>
                <Table columns={columns} dataSource={tokenData}/>
            </div>
        </AppLayout>
    )
}
