import '../styles/globals.css'
import {Web3ReactProvider} from "@web3-react/core";
import {Web3Provider} from "@ethersproject/providers";
import {ContractContextProvider} from "../src/contexts/ContractContext";

const getLibrary = (provider) => {
    return new Web3Provider(provider);
}

function MyApp({Component, pageProps}) {
    return <Web3ReactProvider getLibrary={getLibrary}>
        <ContractContextProvider>
            <Component {...pageProps} />
        </ContractContextProvider>
    </Web3ReactProvider>
}

export default MyApp
