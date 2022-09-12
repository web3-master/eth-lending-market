import {Row} from "antd";
import React from "react";
import {tokenIcons} from "../constants/Images";
import {formatPrice} from "../utils/PriceUtil";

const TokenPrice = ({
    tokenSymbol,
    priceInWei,
    decimals,
    imageSize = 20,
    textSize = 16,
    padding = 10
}) => {
    const icon = tokenIcons[tokenSymbol.toLowerCase()];

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
        {formatPrice(priceInWei, decimals)}
      </span>
        </Row>
    );
};

export default TokenPrice;
