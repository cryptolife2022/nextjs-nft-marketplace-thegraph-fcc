import styles from "../styles/Home.module.css"
// ↓↓↓ Don't forget to import the widgets' fonts! ↓↓↓
import "@uniswap/widgets/fonts.css"
//import "@uniswap/widgets/dist/fonts.css"
import { FiGlobe } from "react-icons/fi"

// Doesn't work with signals
//import { signal } from "@preact/signals"
import { useCallback, useEffect, useRef, useState } from "react"
import { subscribe, unsubscribe, publish } from "./utils/events"

import { SupportedLocale, SUPPORTED_LOCALES, SwapWidget, Theme } from "@uniswap/widgets"
/*
const theme: Theme = {
    // Check out the theme examples below
}
*/
const TOKEN_LIST = "https://gateway.ipfs.io/ipns/tokens.uniswap.org"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
/* 
// Not needed for because of Wagmi
const MAINNET_RPC_URL = process.env.ALCHEMY_MAINNET_RPC_URL
const jsonRpcUrlMap = {
    1: [MAINNET_RPC_URL],
    31337: [MAINNET_RPC_URL],
}
*/
// Signals doesn't work, have to useState
//const localePage = signal("en-US")

export function SelectLocale() {
    // The locale to pass to the SwapWidget.
    // This is a value from the SUPPORTED_LOCALES exported by @uniswap/widgets.
    const onSelectLocale = useCallback((e) => {
        console.log("Locale Send", e.target.value)
        //localePage.value = e.target.value
        publish("web3_onLocaleChange", e.target.value)
    }, [])

    return (
        <div className={styles.i18n}>
            <label style={{ display: "flex" }}>
                <FiGlobe />
            </label>
            <select onChange={onSelectLocale}>
                {SUPPORTED_LOCALES.map((locale) => (
                    <option key={locale} value={locale}>
                        {locale}
                    </option>
                ))}
            </select>
        </div>
    )
}

export function UniswapWidget() {
    const [localePage, setLocalePage] = useState("en-US")
    useEffect(() => {
        subscribe("web3_onLocaleChange", (e) => {
            //console.log("Locale Recv", e.detail)
            setLocalePage(e.detail)
        })

        return () => {
            console.log("Uniswap Locale Widget Effect Cleanup")
            unsubscribe("web3_onLocaleChange")
        }
    }, [localePage])

    //console.log("Provider", provider)
    return (
        <div className={`Uniswap ml-auto py-2 px-4  ${styles.connectors} ${styles.widget}`}>
            <SwapWidget
                //jsonRpcUrlMap={jsonRpcUrlMap}
                tokenList={TOKEN_LIST}
                //provider={provider} //Not needed because you get it from the WagmiConfig
                locale={localePage}
                hideConnectionUI={true}
                // This is only really needed if hideConnectionUI = false
                onConnectWalletClick={() => {
                    publish("web3_focusWalletConnector")
                    return false
                }}
                defaultInputTokenAddress="NATIVE"
                defaultInputAmount="1"
                defaultOutputTokenAddress={UNI}
            />
        </div>
    )
}
