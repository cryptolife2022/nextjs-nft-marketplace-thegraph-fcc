//events.js
import { useEffect, useState } from "react"

function subscribe(eventName, listener) {
    if (typeof document !== "undefined") {
        document.addEventListener(eventName, listener)
    }
}

function unsubscribe(eventName, listener) {
    if (typeof document !== "undefined") {
        document.removeEventListener(eventName, listener)
    }
}

function publish(eventName, data) {
    if (typeof document !== "undefined") {
        //console.log("CustomEvent ", eventName, ": Dispatched")
        const event = new CustomEvent(eventName, { detail: data })
        document.dispatchEvent(event)
    }
}

function useIsSSR() {
    const [isSSR, setIsSSR] = useState(true)

    // Needed to get rid of Hydration UI error keep popping up
    // https://github.com/vercel/next.js/discussions/35773
    useEffect(() => setIsSSR(false), [])

    return isSSR
}
export { publish, subscribe, unsubscribe, useIsSSR }
