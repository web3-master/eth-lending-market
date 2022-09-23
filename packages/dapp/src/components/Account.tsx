import {Button} from "antd";
import {useWeb3React} from "@web3-react/core";
import {InjectedConnector} from '@web3-react/injected-connector';
import AccountDropdown from "./menus/AccountDropdown";
import {getShortenAddress} from "../utils/AddressUtil";

const Account = () => {
    const {active, account, activate} = useWeb3React();

    const onConnect = () => {
        activate(new InjectedConnector({}), (error) => {
            alert(error);
        })
    }

    return active ? <AccountDropdown><Button>{getShortenAddress(account)}</Button></AccountDropdown>
        :
        <Button onClick={onConnect}>Connect</Button>
};

export default Account;
