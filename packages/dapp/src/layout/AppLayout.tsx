import {ReactNode} from "react";
import {Col, Layout, Row} from "antd";
import {Content, Footer, Header} from "antd/lib/layout/layout";
import logo from "../images/logo.png";
import AppMenu from "./AppMenu";
import Account from "../components/Account";
import {useWeb3React} from "@web3-react/core";
import {ActiveNetwork} from "../constants/Network";
import WrongNetwork from "../containers/WrongNetwork";
import {GithubOutlined, GoogleOutlined, LinkedinOutlined} from "@ant-design/icons";
import {GITHUB, GITHUB_PROJECT, GMAIL, LINKEDIN} from "../constants/Links";

const AppLayout = ({children}: { children: ReactNode }) => {
    const {active, chainId} = useWeb3React();
    return (
        <Row>
            <Col span={24}>
                <Layout style={{minHeight: "100vh"}}>
                    <Header style={{position: "fixed", zIndex: 1, width: "100%"}}>
                        <Row align="stretch" gutter={20}>
                            <Col>
                                <img src={logo.src} width={40} height={40} alt="logo"/>
                            </Col>
                            <Col>
                                <h1>
                                    ETH Lending Market
                                </h1>
                            </Col>
                            <Col flex="auto">
                                <AppMenu/>
                            </Col>
                            <Col style={{marginRight: 10}}>
                                <Account/>
                            </Col>
                            <Col>
                                <div>
                                    <a href={GITHUB_PROJECT} target="_blank"
                                       rel="noopener noreferrer"><GithubOutlined
                                        style={{fontSize: 20}}/></a>
                                </div>
                            </Col>
                        </Row>
                    </Header>
                    <Content style={{marginTop: 60}}>
                        {active && chainId == ActiveNetwork ? children :
                            <WrongNetwork/>
                        }
                    </Content>
                    <Footer
                        style={{
                            position: "sticky",
                            bottom: 0,
                            textAlign: 'center'
                        }}
                    >
                        © 2022 All rights reserved by Web3-Master.
                        <a href={GMAIL} rel="noopener noreferrer"><GoogleOutlined
                            style={{fontSize: 16, marginLeft: 20}}/></a>
                        <a href={LINKEDIN} target="_blank"
                           rel="noopener noreferrer"><LinkedinOutlined
                            style={{fontSize: 16, marginLeft: 10}}/></a>
                        <a href={GITHUB} target="_blank" rel="noopener noreferrer"><GithubOutlined
                            style={{fontSize: 16, marginLeft: 10}}/></a>
                    </Footer>
                </Layout>
            </Col>
        </Row>
    );
}

export default AppLayout;
