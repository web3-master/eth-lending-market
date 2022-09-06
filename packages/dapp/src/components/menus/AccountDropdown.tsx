import {Dropdown, Menu} from 'antd';
import React from 'react';
import {useWeb3React} from "@web3-react/core";
import {
    BankOutlined,
    CloudOutlined,
    CopyOutlined,
    LogoutOutlined,
    SearchOutlined
} from "@ant-design/icons";
import {formatAddress} from "../../utils/AddressUtil";
import {
    getExplorerLinkWithChainIdAndAddress,
    getNetworkNameWithChainId
} from "../../utils/NetworkUtil";

const AccountDropdown = ({children}) => {
    const {account, chainId, deactivate} = useWeb3React();

    const onMenuItemClick = ({item, key}) => {
        switch (key) {
            case 'copy_address':
                navigator.clipboard.writeText(account);
                break;
            case 'view_on_explorer':
                let link = getExplorerLinkWithChainIdAndAddress(chainId, account);
                if (link != null) {
                    window.open(link);
                }
                break;
            case 'disconnect_wallet':
                deactivate();
                break;
        }
    };

    return <Dropdown
        overlay={
            <Menu onClick={onMenuItemClick}>
                <Menu.Item icon={<BankOutlined/>}>
                    {formatAddress(account)}
                </Menu.Item>
                <Menu.Divider/>
                <Menu.Item icon={<CloudOutlined/>}>
                    {getNetworkNameWithChainId(chainId)}
                </Menu.Item>
                <Menu.Divider/>
                <Menu.Item key='copy_address' icon={<CopyOutlined/>}>
                    Copy address
                </Menu.Item>
                <Menu.Item key='view_on_explorer' icon={<SearchOutlined/>}>
                    View on Explorer
                </Menu.Item>
                <Menu.Item key='disconnect_wallet' icon={<LogoutOutlined/>}>
                    Disconnect Wallet
                </Menu.Item>
                <Menu.Divider/>
            </Menu>
        }
        trigger={['click']}>
        {children}
    </Dropdown>
};

export default AccountDropdown;
