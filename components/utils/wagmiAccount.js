import { useSession, signOut } from "next-auth/react"
import { useAccount as wagmiAccount } from "wagmi"
import { publish } from "./events"
import { loginRequestPath, userPage } from "../../constants"
import axios from "axios"

const handleAuth = async ({ userData, router, disconnect, signMessageAsync, signIn }) => {
    try {
        console.log("post: ", userData, "request: ", loginRequestPath)
        const { data } = await axios.post(loginRequestPath, userData, {
            headers: {
                "content-type": "application/json",
            },
        })
        console.log("request-message: ", data)
        const message = data.message
        const signature = await signMessageAsync({ message })

        console.log("request-message: signature - ", signature)
        // redirect user after success authentication to 'userPage' page
        const { url } = await signIn("credentials", {
            message,
            signature,
            redirect: false, //let user go to "userPage" if they want to ... demo purposes only
            callbackUrl: userPage,
        })
        // instead of using signIn(..., redirect: userPage)
        // we get the url from callback and push it to the router to avoid page refreshing
        router(url)
    } catch (error) {
        const errorMsg = !error.message.__proto__.constructor.name.includes("Array")
            ? error.message
            : "SignIn denied by user"
        console.log("SignIn Rejected - ", errorMsg)
        disconnect(errorMsg)
    }
}

/*
const {
    address,
    connector,
    isConnecting,
    isReconnecting,
    isConnected,
    isDisconnected,
    //status, // : 'connecting' | 'reconnecting' | 'connected' | 'disconnected'
}
*/
function useAccount(signOutRedirectPath) {
    const { status } = useSession()

    return wagmiAccount({
        fetchEns: true,
        onConnect({ address, connector, isReconnected }) {
            console.log("Connected to Web3 Wallet", { address, connector, isReconnected })
            publish("web3_onConnect", { address, connector, isReconnected })
        },
        onDisconnect() {
            const path = signOutRedirectPath
                ? { callbackUrl: signOutRedirectPath }
                : { redirect: false }
            console.log("Disconnected from Web3 Wallet redirectPath(", path, ")")
            publish("web3_onDisconnect")

            if (status !== "unauthenticated") signOut(path)
        },
    })
}

export { useAccount, handleAuth }
