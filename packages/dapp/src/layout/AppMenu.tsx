import {Menu} from "antd";
import Link from "next/link";
import {DashboardOutlined, BankOutlined, ExperimentOutlined} from "@ant-design/icons";

const AppMenu = () => {
    return (
        <Menu theme="dark" mode="horizontal">
            <Menu.Item key="index" icon={<DashboardOutlined />}>
                <Link href="/">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="markets" icon={<BankOutlined />}>
                <Link href="/markets">Markets</Link>
            </Menu.Item>
            <Menu.Item key="faucet" icon={<ExperimentOutlined />}>
                <Link href="/faucet">Faucet</Link>
            </Menu.Item>
        </Menu>
    );
};

export default AppMenu;
