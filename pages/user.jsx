import { signOutRedirectPath, signInPage } from "../constants"
import { useEffect, useState } from "react"
//import { getSession, signOut } from "next-auth/react"
import { useRouter } from "next/router"
import { useDisconnect } from "wagmi"
import { subscribe, unsubscribe, useIsSSR } from "../components/utils/events"

import { useAccount } from "../components/utils/wagmiAccount"

function User(/*{ user }*/) {
    const { push } = useRouter()
    const { disconnect } = useDisconnect()
    const isSSR = useIsSSR()

    const { address, isConnected } = useAccount(signOutRedirectPath)
    const [user, setUser] = useState(isConnected ? { address } : {})

    //
    // Client side rendering
    //
    useEffect(() => {
        subscribe("web3_onConnect", function (event) {
            console.log("setUser", event.detail)
            setUser({ address: event.detail.address })
        })

        return () => {
            console.log("Effect Cleanup")
            unsubscribe("web3_onConnect")
        }
    }, [isConnected])

    return (
        <div>
            <h4>User session:</h4>
            {!isSSR ? <pre>{JSON.stringify(user, null, 2)}</pre> : <pre></pre>}
            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                onClick={() => {
                    disconnect()
                }}
            >
                <div>Sign Out</div>
            </button>
            <br /> <br />
            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                onClick={() => push(signInPage)}
            >
                <div>Back to Home Page</div>
            </button>
        </div>
    )
}

// IPFS doesn't support server side render
/*
export async function getServerSideProps(context) {
    const session = await getSession(context)

    if (!session) {
        return {
            redirect: {
                destination: signInPage,
                permanent: false,
            },
        }
    }

    return {
        props: { user: session.user },
    }
}
*/

export default User
