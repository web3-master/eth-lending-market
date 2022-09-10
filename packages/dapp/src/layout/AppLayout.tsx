import {ReactNode} from "react";
import {Col, Layout, Row} from "antd";
import { Content, Footer, Header } from "antd/lib/layout/layout";
import logo from "../images/logo.png";
import AppMenu from "./AppMenu";
import Account from "../components/Account";
import {useWeb3React} from "@web3-react/core";
import {ActiveNetwork} from "../constants/Network";
import WrongNetwork from "../containers/WrongNetwork";

const AppLayout = ({children}: { children: ReactNode }) => {
    const {active, account, activate, chainId} = useWeb3React();
    return (
        <Row>
            <Col span={24}>
                <Layout style={{ minHeight: "100vh" }}>
                    <Header>
                        <Row align="stretch" gutter={20}>
                            <Col>
                                <img src={logo.src} width={40} height={40} alt="logo" />
                            </Col>
                            <Col>
                                <h1>
                                    ETH Lending Market
                                </h1>
                            </Col>
                            <Col flex="auto">
                                <AppMenu />
                            </Col>
                            <Col style={{ marginRight: 10 }}>
                                <Account />
                            </Col>
                        </Row>
                    </Header>
                    <Content>
                        {active && chainId == ActiveNetwork ? children :
                            <WrongNetwork />
                        }

                    </Content>
                    <Footer
                        style={{
                            position: "sticky",
                            bottom: 0,
                            textAlign: 'center'
                        }}
                    >
                        © 2022 All rights reserved by Daniel Armstrong.
                    </Footer>
                </Layout>
            </Col>
        </Row>
    );
}

export default AppLayout;
