import {Col, Row} from "antd";

interface TokenPropertyParam {
    label: string;
    value: number;
    prefix: string | null;
    suffix: string | null;
}

const labelStyle = {fontSize: 14, color: 'gray'};
const prefixStyle = {fontSize: 20, color: 'gray'};
const valueStyle = {fontSize: 20, fontWeight: 'bold'};

const TokenProperty = ({label, value, prefix, suffix}: TokenPropertyParam) => {
    return (
        <div>
            <span style={labelStyle}>{label}</span>
            <Row align="middle" justify="center" gutter={4}>
                {prefix != null &&
                    <Col><span style={prefixStyle}>{prefix}</span></Col>
                }
                <Col><span style={valueStyle}>{value.toLocaleString()}</span></Col>
                {suffix != null &&
                    <Col><span style={prefixStyle}>{suffix}</span></Col>
                }
            </Row>
        </div>
    );
}

export default TokenProperty;
