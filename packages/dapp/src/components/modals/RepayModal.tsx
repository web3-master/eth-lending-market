import {Button, Col, InputNumber, Modal, Row} from "antd";
import React, {useEffect, useState} from "react";
import {DataType} from "../../../pages";
import {useWeb3React} from "@web3-react/core";
import {ContractContextData, useContractContext} from "../../contexts/ContractContext";
import TokenIconSymbol from "../TokenIconSymbol";
import {BigNumber} from "@ethersproject/bignumber";

interface RepayModalParam {
    cTokenData: DataType;
    onClose: Function
}

const RepayModal = (props: RepayModalParam) => {
    const {account, library} = useWeb3React();
    const {
        comptroller
    }: ContractContextData = useContractContext();
    const [processing, setProcessing] = useState(false);
    const [currentWork, setCurrentWork] = useState("Repay");
    const [maxRepay, setMaxRepay] = useState(0);
    const [value, setValue] = useState(0);

    useEffect(() => {
        (async () => {
            const accountSnapshot = await props.cTokenData.key.getAccountSnapshot(account);
            const totalBorrowInUnderlyingToken = accountSnapshot[2].div(
                BigNumber.from(10).pow(props.cTokenData.decimals)).toNumber();
            setMaxRepay(totalBorrowInUnderlyingToken);
        })();
    }, [comptroller, account]);

    const onChange = (value: number) => {
        setValue(value);
    }

    const onModalOk = async () => {
        if (value == null || value == 0) {
            alert('Please input value!');
            return;
        }

        const repayAmount = BigNumber.from(value * 100).mul(
            BigNumber.from(10).pow(props.cTokenData.decimals)).div(100);
        if (value > maxRepay) {
            alert('Balance is not enough!');
            return;
        }

        setProcessing(true);

        const cToken = props.cTokenData.key;
        const signer = library.getSigner();

        try {
            const isEntered = await comptroller.checkMembership(account, cToken.address);

            let tx;
            if (!isEntered) {
                setCurrentWork("Token enabling...");
                tx = await comptroller.connect(signer).enterMarkets([cToken.address]);
                await tx.wait();
            }

            if (props.cTokenData.token != null) {
                setCurrentWork("Token approving...");
                tx = await props.cTokenData.token.connect(signer).approve(cToken.address,
                    repayAmount)
                await tx.wait();
            }

            setCurrentWork("Repaying...");
            tx = await cToken.connect(signer).repayBorrow(repayAmount);
            const result = await tx.wait();

            setCurrentWork("Success!");
            setProcessing(false);
            props.onClose(result);
        } catch (e) {
            alert("Operation failed.");
            setCurrentWork("Repay");
            setProcessing(false);
        }
    }

    return (
        <Modal
            title={`Repay ${props.cTokenData.symbol}`}
            open={true}
            onOk={onModalOk}
            confirmLoading={processing}
            footer={[
                <Button key="back" onClick={() => {
                    props.onClose()
                }}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" loading={processing} onClick={onModalOk}>
                    {currentWork}
                </Button>,
            ]}
            onCancel={() => props.onClose()}
        >
            <p>Transaction Overview</p>
            <Row align="middle" gutter={10} style={{marginBottom: 10}}>
                <Col>
                    Amount
                </Col>
                <Col flex={1}>
                    <InputNumber min={0.1} max={10000} style={{width: '100%'}} onChange={onChange}/>
                </Col>
                <Col>
                    <TokenIconSymbol symbol={props.cTokenData.symbol}/>
                </Col>
            </Row>
            <span style={{fontSize: 14, color: 'gray'}}>
                (Repayable Max: {maxRepay.toFixed(2)} {props.cTokenData.symbol})
            </span>

        </Modal>
    );
};

export default RepayModal;
