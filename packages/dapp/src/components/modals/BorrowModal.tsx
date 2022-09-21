import {Button, Col, InputNumber, Modal, Row} from "antd";
import React, {useEffect, useState} from "react";
import {DataType} from "../../../pages";
import {useWeb3React} from "@web3-react/core";
import {ContractContextData, useContractContext} from "../../contexts/ContractContext";
import TokenIconSymbol from "../TokenIconSymbol";
import {BigNumber} from "@ethersproject/bignumber";
import {Mantissa} from "../../utils/PriceUtil";

interface BorrowModalParam {
    cTokenData: DataType;
    onClose: Function
}

const BorrowModal = (props: BorrowModalParam) => {
    const {active, account, activate, library, connector} = useWeb3React();
    const {
        cTokenUnderlyings,
        cTokenUnderlyingPrices,
        comptroller
    }: ContractContextData = useContractContext();
    const [processing, setProcessing] = useState(false);
    const [currentWork, setCurrentWork] = useState("Borrow");
    const [liquidity, setLiquidity] = useState(0);
    const [maxBorrow, setMaxBorrow] = useState(0);
    const [value, setValue] = useState(0);

    useEffect(() => {
        (async () => {
            const underlyingTokenLiquidity = await props.cTokenData.key.getCash();
            const accountLiquidity = await comptroller.getAccountLiquidity(account);
            const liquidity = accountLiquidity[1].div(Mantissa).toNumber();
            const shortfall = accountLiquidity[2].div(Mantissa).toNumber();
            if (liquidity > 0) {
                setLiquidity(liquidity);
                setMaxBorrow(
                    Math.min(liquidity / props.cTokenData.underlyingPrice.div(Mantissa).toNumber(),
                        underlyingTokenLiquidity.div(
                            BigNumber.from(10).pow(props.cTokenData.decimals)).toNumber()));
            } else if (shortfall > 0) {
                alert('Your liquidity is not enough!');
                props.onClose();
            }
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
        const borrowAmount = BigNumber.from(value * 100).mul(
            BigNumber.from(10).pow(props.cTokenData.decimals)).div(100);
        if (value > maxBorrow) {
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

            tx = await cToken.connect(signer).borrow(borrowAmount);
            const result = await tx.wait();

            setCurrentWork("Success!");
            setProcessing(false);
            props.onClose(result);
        } catch (e) {
            console.log('error', e);
            alert("Operation failed.");
            setCurrentWork("Borrow");
            setProcessing(false);
        }
    }

    return (
        <Modal
            title={`Borrow ${props.cTokenData.symbol}`}
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
                (Borrowable Max: {maxBorrow.toFixed(2)} {props.cTokenData.symbol})
            </span>

        </Modal>
    );
};

export default BorrowModal;
