import {ChainId, networkConfigs} from "../constants/Network";

export const getNetworkNameWithChainId = (chainId: ChainId): string => {
    if (networkConfigs.hasOwnProperty(chainId)) {
        return networkConfigs[chainId].name;
    }

    return 'Unknown network';
}

export const getExplorerLinkWithChainIdAndAddress = (chainId: ChainId, address: string): string | null => {
    if (networkConfigs.hasOwnProperty(chainId)) {
        return networkConfigs[chainId].explorerLink + '/address/' + address;
    }

    return null;
}
