import styles from "../styles/Home.module.css"

import { subscribe, unsubscribe, useIsSSR } from "./utils/events"
import { useEffect, useRef } from "react"

import { useNetwork, useDisconnect, useSignMessage } from "wagmi"
import { useAccount, handleAuth } from "./utils/wagmiAccount"

import { useRouter } from "next/router"
import { ConnectButton } from "@rainbow-me/rainbowkit"
//import { ConnectKitButton as ConnectButton } from "connectkit"
import { signIn, useSession } from "next-auth/react"
import Link from "next/link"
import { handleErrorNotification, handleNewNotification } from "./utils/handleNotification"
import { useNotification } from "web3uikit"

export default function Header() {
    // When a user clicks "Connect your wallet" in the SwapWidget, this callback focuses the connectors.
    const connectors = useRef(null)
    const { push: router } = useRouter()
    const { chain } = useNetwork()
    const { status } = useSession()
    const { address, isConnected } = useAccount()
    const dispatch = useNotification()
    const { disconnect } = useDisconnect()
    const { signMessageAsync } = useSignMessage()

    // UI Hydration Bug fix
    // Not neccessary with signals
    const isSSR = useIsSSR()

    useEffect(() => {
        if (status === "unauthenticated" && isConnected) {
            handleAuth({
                userData: { address: address, chain: chain.id, network: "evm" },
                router: router,
                disconnect: (errorMsg) => {
                    disconnect()
                    handleErrorNotification(dispatch, "SignIn Failed", errorMsg)
                },
                signMessageAsync: signMessageAsync,
                signIn: signIn,
            })
        } else {
            console.log("Header login: status - ", status)
        }

        if (!isSSR && status !== "loading") {
            console.log("Wallet Focus Effect Registration")
            subscribe("web3_focusWalletConnector", function () {
                connectors.current?.focus()
            })

            return () => {
                console.log("Wallet Focus Effect Cleanup")
                unsubscribe("web3_focusWalletConnector")
            }
        }
    }, [status, isConnected])

    return (
        <nav className="pb-5 px-5 border-b-2 flex flex-row justify-between items-center">
            <h1 className="py-4 px-4 font-bold text-3xl">NFT Marketplace</h1>
            <div className="flex flex-row items-center">
                <Link href="/">
                    <a className="mr-4 p-6">Nft Marketplace</a>
                </Link>
                <Link href="/sell-nft">
                    <a className="mr-4 p-6">Sell NFT</a>
                </Link>
                {isSSR || status === "loading" ? (
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        disabled
                    >
                        <div className="float-left">
                            <div className="float-left animate-spin spinner-border h-4 w-4 border-b-2 p-1 rounded-full"></div>
                            <div className="inline-block p-1 ml-2 align-middle">
                                Loading Account ...
                            </div>
                        </div>
                    </button>
                ) : (
                    <ConnectButton
                        chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
                        showBalance={{ smallScreen: false, largeScreen: true }}
                        accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
                        label="Connect Wallet"
                        ref={connectors}
                        tabIndex={-1}
                        className={`${styles.connectors}`}
                    />
                )}
            </div>
        </nav>
    )
}
