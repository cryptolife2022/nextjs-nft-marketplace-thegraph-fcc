import CredentialsProvider from "next-auth/providers/credentials"
import NextAuth from "next-auth"
import Moralis from "moralis"

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: "MoralisAuth",
            credentials: {
                message: {
                    label: "Message",
                    type: "text",
                    placeholder: "0x0",
                },
                signature: {
                    label: "Signature",
                    type: "text",
                    placeholder: "0x0",
                },
            },
            async authorize(credentials) {
                //console.log("nextauth: - Moralis.start: Begin")
                try {
                    // "message" and "signature" are needed for authorization
                    // we described them in "credentials" above
                    const { message, signature } = credentials

                    await Moralis.start({ apiKey: process.env.MORALIS_API_KEY })

                    //console.log("nextauth: - Moralis.start: Begin ", message)
                    const { address, profileId, expirationTime } = (
                        await Moralis.Auth.verify({ message, signature, network: "evm" })
                    ).raw

                    //console.log("nextauth: - Moralis.start: Middle ", address)
                    const user = { address, profileId, expirationTime, signature }
                    // returning the user object and creating  a session
                    //console.log("nextauth: - Moralis.start: Finished ", user)
                    return user
                } catch (e) {
                    console.log("nextauth: Error - ", e)
                    return null
                }
            },
        }),
    ],
    // adding user info to the user session object
    callbacks: {
        async jwt({ token, user }) {
            user && (token.user = user)
            return token
        },
        async session({ session, token }) {
            session.expires = token.user.expirationTime
            session.user = token.user
            return session
        },
    },
})
