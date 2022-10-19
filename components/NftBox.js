import { handleErrorNotification, handleNewNotification } from "./utils/handleNotification"

import { useState, useEffect } from "react"
//import { useWeb3Contract, useMoralis } from "react-moralis"
import { useNetwork } from "wagmi"
import { useAccount } from "./utils/wagmiAccount"
import { readContract, writeContract, eventContract } from "./utils/wagmiContract"
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"
import UpdateListingModal from "./UpdateListingModal"

const truncateStr = (fullStr, strLen) => {
    if (fullStr.length <= strLen) return fullStr

    const separator = "..."
    const seperatorLength = separator.length
    const charsToShow = strLen - seperatorLength
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)
    return (
        fullStr.substring(0, frontChars) + separator + fullStr.substring(fullStr.length - backChars)
    )
}

export default function NFTBox({ price, nftAddress, tokenId, marketplaceAddress, seller }) {
    const { address, isConnected } = useAccount()
    const { chain } = useNetwork()
    //const { isWeb3Enabled, account } = useMoralis()
    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [showModal, setShowModal] = useState(false)
    const hideModal = () => setShowModal(false)
    const dispatch = useNotification()

    // struct method
    // {
    //     contractName,
    //     func,
    //     args,
    //     onError,
    //     onSuccess,
    //     overrides,
    // }
    const {
        contractReadRCs,
        addresses: basicNftAddresses,
        isSuccessAll,
    } = readContract(
        [
            {
                contractName: "BasicNft",
                func: "tokenURI",
                args: [tokenId],
                onError: (error) => {
                    console.log(`On Contract tokenURI ${error}`)
                },
                onSuccess: async (data) => {
                    let tokenURI = data
                    //console.log(`The TokenURI is ${tokenURI}`)
                    // We are going to cheat a little here...
                    if (tokenURI) {
                        // IPFS Gateway: A server that will return IPFS files from a "normal" URL.
                        const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
                        const tokenURIResponse = await (await fetch(requestURL)).json()
                        const imageURI = tokenURIResponse.image
                        const imageURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/")
                        setImageURI(imageURIURL)
                        setTokenName(tokenURIResponse.name)
                        setTokenDescription(tokenURIResponse.description)
                        // We could render the Image on our sever, and just call our sever.
                        // For testnets & mainnet -> use moralis server hooks
                        // Have the world adopt IPFS
                        // Build our own IPFS gateway
                    }
                    // get the tokenURI
                    // using the image tag from the tokenURI, get the image

                    console.log(`On Contract tokenURI Success: `, tokenURI, `price ${price}`)
                    //publish("nftMktPlace_tokenURI", { data })
                },
            },
        ],
        chain
    )

    const { writeRCs, isBusy, preWriteRCs } = writeContract(
        [
            {
                contractName: "NftMarketplace",
                func: "buyItem",
                args: [nftAddress, tokenId],
                overrides: {
                    value: price,
                },
                onError: (error) => {
                    // {code, message}
                    var msg = JSON.parse(
                        error.message
                            .split("[ethjs-query] while formatting outputs from RPC ")[1]
                            .slice(1, -1)
                    ).value.data.message

                    console.log("On Contract buyItem Error - ", msg)
                    handleErrorNotification(dispatch, "NFT BuyItem Failed", msg)
                },
                onSuccess: (tx) => {
                    ;(async () => {
                        console.log("On Contract buyItem Success", tx) // {hash, wait}
                        const msg =
                            "Bought NFT [" + nftAddress.toString() + ", TokenId(" + tokenId + ")]"
                        addRecentTransaction({
                            hash: tx.hash,
                            description: msg,
                            confirmations: 1,
                        })
                        await tx.wait(1)
                        handleNewNotification(dispatch, "NFT BuyItem", msg)
                    })()
                },
            },
        ],
        chain
    )

    function getTokenURI() {
        const rc = contractReadRCs[0]

        //console.log("contractReadRCs[0]...", rc)
        if (!rc.isLoading && !rc.isFetching && !rc.isRefetching) {
            console.log("getTokenURI...")
            contractReadRCs[0].refetch()
        }
    }

    function buyItem() {
        if (writeRCs[0].write) {
            writeRCs[0].write()
        } else {
            // Reason in preWriteRC
            console.log("Cannot Buy Item. writeRCs Reason - ", preWriteRCs[0].error)
            console.log("preWriteRCs Reason - ", preWriteRCs[0].error)
        }
    }

    /*
    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId,
        },
    })

    const { runContractFunction: buyItem } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
        },
    })
    */

    useEffect(() => {
        if (isConnected) getTokenURI()
    }, [isConnected])

    const isOwnedByUser =
        seller.toString().toUpperCase() == address.toString().toUpperCase() || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15)
    const formattedNftAddress = truncateStr(nftAddress || "", 15)

    const handleCardClick = () => {
        isOwnedByUser ? setShowModal(true) : buyItem()
        // : buyItem({
        //       onError: (error) => console.log(error),
        //       onSuccess: handleBuyItemSuccess,
        //   })
    }
    /*
    const handleBuyItemSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Item bought!",
            title: "Item Bought",
            position: "topR",
        })
    }
    */

    return (
        <div>
            {imageURI ? (
                <div className="mr-2">
                    <UpdateListingModal
                        isVisible={showModal}
                        tokenId={tokenId}
                        marketplaceAddress={marketplaceAddress}
                        nftAddress={nftAddress}
                        onClose={hideModal}
                    />
                    <Card
                        title={tokenName}
                        description={tokenDescription}
                        onClick={handleCardClick}
                    >
                        <div className="p-2">
                            <div className="flex flex-col items-end gap-2">
                                <div>#{tokenId}</div>
                                <div className="italic text-sm">
                                    Owned by {formattedSellerAddress}
                                </div>
                                <div className="italic text-sm">
                                    NftAddress {formattedNftAddress}
                                </div>
                                <Image
                                    loader={() => imageURI}
                                    src={imageURI}
                                    height="200"
                                    width="200"
                                />
                                <div className="font-bold">
                                    {ethers.utils.formatUnits(price, "ether")} ETH
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="relative h-48 w-48 p-2">
                    <div className="absolute left-2/4 top-2/4 animate-spin spinner-border h-8 w-8 border-b-2 -ml-4 -mt-4 rounded-full"></div>
                </div>
            )}
        </div>
    )
}
