import Moralis from "moralis"

const config = {
    domain: process.env.APP_DOMAIN || "ethereum.boilerplate",
    statement: "Please sign this message to confirm your identity.",
    uri: process.env.NEXTAUTH_URL || "http://localhost:3000",
    timeout: 60,
}

export default async function handler(req, res) {
    const { address, chain, network } = JSON.parse(req.body)

    //console.log("Moralis.start")

    await Moralis.start({ apiKey: process.env.MORALIS_API_KEY })

    //console.log("Moralis.Auth.requestMessage Start")

    try {
        const finalConfig = {
            address,
            chain: parseInt(chain) != process.env.HARDHAT_ID ? chain : 1, // Hardcoded to 1 because Hardhat ChainID isn't supported by Moralis/NextAuth interaction
            network,
            ...config,
        }
        //console.log("req ", req)
        //console.log("FinalConfig", finalConfig)
        const message = await Moralis.Auth.requestMessage(finalConfig)
        //console.log("Message ", message)
        res.status(200).json(message)
    } catch (error) {
        res.status(400).json({ error })
        console.log("Moralis.Auth.requestMessage Error: ", error)
    }
}
