import {Row} from "antd";
import {tokenIcons} from "../constants/Images";
import React from "react";

interface TokenIconSymbolParam {
    symbol: string;
    imageSize?: number;
    textSize?: number;
    padding?: number;
}

const TokenIconSymbol = ({
    symbol, imageSize = 20, textSize = 16,
    padding = 10
}: TokenIconSymbolParam) => {
    const icon = tokenIcons[symbol.toLowerCase()];

    return (
        <Row justify="center" align="middle">
            <img src={icon.src} width={imageSize} height={imageSize}/>
            <span
                style={{
                    fontSize: textSize,
                    fontWeight: "600",
                    marginLeft: padding,
                }}
            >
                {symbol}
            </span>
        </Row>
    );
}

export default TokenIconSymbol;
