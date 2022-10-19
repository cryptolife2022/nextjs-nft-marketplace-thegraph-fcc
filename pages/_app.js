import "../styles/globals.css"
import "@rainbow-me/rainbowkit/styles.css"

import Head from "next/head"
import { SelectLocale } from "../components/UniswapWidget"
import Image from "next/image"
import Header from "../components/Header"

import { appName, favIcon } from "../constants"
//import { MoralisProvider } from "react-moralis"
import { createClient, configureChains, defaultChains, WagmiConfig, chain } from "wagmi"
//import { InjectedConnector } from "wagmi/connectors/injected"
//import { MetaMaskConnector } from "wagmi/connectors/metaMask"
//import { WalletConnectConnector } from "wagmi/connectors/walletConnect"
import { publicProvider } from "wagmi/providers/public"
import { SessionProvider } from "next-auth/react"
import { NotificationProvider } from "web3uikit"
//import { ConnectKitProvider as RainbowKitProvider, getDefaultClient } from "connectkit"

import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client"

const graphClient = new ApolloClient({
    cache: new InMemoryCache(),
    uri:
        process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
        "https://api.studio.thegraph.com/query/36640/nft-marketplace-test/v0.0.3",
})

import { connectorsForWallets, getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import {
    injectedWallet,
    rainbowWallet,
    metaMaskWallet,
    coinbaseWallet,
    omniWallet,
    walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets"

const hardhatId = process.env.NEXT_PUBLIC_HARDHAT_ID ?? chain.hardhat.id
chain.hardhat.id = parseInt(hardhatId)
const cchains = [
    chain.hardhat, //Top of the list for first default choice
    chain.polygon,
    chain.ropsten,
    chain.rinkeby,
    chain.goerli,
    chain.kovan,
    chain.sepolia,
]
if (chain.hardhat.id != chain.mainnet.id) cchains.splice(1, 0, chain.mainnet)

//const { provider, webSocketProvider, chains } = configureChains(defaultChains, [publicProvider()])
const { provider, webSocketProvider, chains } = configureChains(cchains, [publicProvider()])

// const needsInjectedWalletFallback =
//     typeof !window?.ethereum && !window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet

const walletConfig = {
    appName: appName,
    chains: chains,
    options: {
        shimDisconnect: true,
        shimChainChangedDisconnect: true,
        UNSTABLE_shimOnConnectSelectAccount: true,
    },
}

const connectors = connectorsForWallets([
    {
        groupName: "Suggested",
        wallets: [
            metaMaskWallet(walletConfig),
            coinbaseWallet(walletConfig),
            omniWallet(walletConfig),
            injectedWallet(walletConfig),
            rainbowWallet(walletConfig),
            walletConnectWallet(walletConfig),
            //wallet.trust(walletConfig),
            //wallet.ledger(walletConfig),
            //wallet.argent(walletConfig),
            //wallet.injected(walletConfig),
        ],
    },
])

/*
const connectors = [
    new InjectedConnector({
        chains: chains,
        options: {
            shimDisconnect: true,
            shimChainChangedDisconnect: true,
        },
    }),
    new MetaMaskConnector({
        chains: chains,
        options: {
            shimDisconnect: true,
            shimChainChangedDisconnect: true,
        },
    }),
    new WalletConnectConnector({
        chains: chains,
        options: {
            qrcode: true,
        },
    }),
]

const client = createClient(
    getDefaultClient({
        appName: appName,
        chains,
    })
)

const { connectors } = getDefaultWallets({
    appName: appName,
    chains,
})
*/

const client = createClient({
    provider,
    webSocketProvider,
    autoConnect: true,
    // added connectors from rainbowkit
    connectors,
})

export default function MyApp({ Component, pageProps }) {
    //console.log("chain : ", chain)
    const disclaimer = ({ Text, Link }) => (
        <Text>
            By connecting your wallet, you agree to the{" "}
            <Link
                target="_blank"
                rel="noopener noreferrer"
                href="https://en.wikipedia.org/wiki/Terms_of_service"
            >
                Terms of Service
            </Link>{" "}
            <Link
                target="_blank"
                rel="noopener noreferrer"
                href="https://en.wikipedia.org/wiki/Privacy_policy"
            >
                Privacy Policy
            </Link>
        </Text>
    )
    /*
    const disclaimer = {
        embedGoogleFonts: true,
        //avoidLayoutShift: false,
        //walletConnectName: "Wallet Connect",
        disclaimer: (
            <>
                By connecting your wallet you agree to the{" "}
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://en.wikipedia.org/wiki/Terms_of_service"
                >
                    Terms of Service
                </a>{" "}
                and{" "}
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://en.wikipedia.org/wiki/Privacy_policy"
                >
                    Privacy Policy
                </a>
            </>
        ),
    }
    */

    return (
        <WagmiConfig client={client}>
            <SessionProvider session={pageProps.session} refetchInterval={0}>
                {/*<RainbowKitProvider theme="auto" mode="auto" options={disclaimer}>*/}
                <RainbowKitProvider
                    chains={chains}
                    showRecentTransactions={true}
                    appInfo={{
                        appName: appName,
                        disclaimer: disclaimer,
                    }}
                >
                    <ApolloProvider client={graphClient}>
                        <NotificationProvider>
                            <Head>
                                <title>{appName}</title>
                                <meta name="description" content={appName} />
                                <link rel="icon" href={favIcon} />
                            </Head>
                            <SelectLocale />
                            <Header />
                            <Component {...pageProps} />
                        </NotificationProvider>
                    </ApolloProvider>
                </RainbowKitProvider>
            </SessionProvider>
        </WagmiConfig>
    )
}

/*
export default function MyApp({ Component, pageProps }) {
    return (
        <MoralisProvider initializeOnMount={false}>
            <Component {...pageProps} />
        </MoralisProvider>
    )
}
*/
