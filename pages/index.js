import styles from "../styles/Home.module.css"

import constants from "../constants"
import { useIsSSR } from "../components/utils/events"
//import LotteryEntrance from "../components/LotteryEntrance"
import { useAccount } from "../components/utils/wagmiAccount"
import { useNetwork, useSwitchNetwork } from "wagmi"

import NFTBox from "../components/NFTBox"
import { useQuery } from "@apollo/client"
import { UniswapWidget } from "../components/UniswapWidget"

export default function Home() {
    // UI Hydration Bug fix
    // Not neccessary with signals
    const isSSR = useIsSSR()

    //const { isWeb3Enabled, chainId } = useMoralis()
    const { address } = useAccount()
    const { chain } = useNetwork()

    const chainString = chain?.id ? parseInt(chain.id).toString() : "31337"
    let nftMarketplaceAddress = chain
        ? chain.id in constants.contractAddresses
            ? constants.contractAddresses[chainString]["NftMarketplace"][0]
            : 0
        : 0
    //const nftMarketplaceAddress = networkMapping[chainString].NftMarketplace[0]

    const { loading, error, data: listedNfts } = useQuery(constants.GET_ACTIVE_ITEMS)
    return (
        <div className={styles.container}>
            <div className="p-5 border-b-2 flex flex-row">
                <div className="container mx-auto">
                    <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
                    <div className="flex flex-wrap">
                        {!isSSR && address ? (
                            loading || !listedNfts ? (
                                <div className="float-left">
                                    <div className="float-left animate-spin spinner-border h-8 w-8 border-b-2 p-1 rounded-full"></div>
                                    <div className="inline-block p-1 ml-2 align-middle">
                                        Loading ...
                                    </div>
                                </div>
                            ) : (
                                listedNfts.nftMarketplaceActiveItems.map((nft) => {
                                    //console.log("nftMarketplaceActiveItems - ", nft)
                                    const { price, nftAddress, tokenId, seller } = nft
                                    return (
                                        <NFTBox
                                            price={price}
                                            nftAddress={nftAddress}
                                            tokenId={tokenId}
                                            marketplaceAddress={nftMarketplaceAddress}
                                            seller={seller}
                                            key={`${nftAddress}${tokenId}`}
                                        />
                                    )
                                })
                            )
                        ) : (
                            <div>Web3 Currently Not Enabled</div>
                        )}
                    </div>
                </div>
                {/*<LotteryEntrance />*/}
                <UniswapWidget />
            </div>
        </div>
    )
}
