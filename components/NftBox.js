import { handleErrorNotification, handleNewNotification } from "./utils/handleNotification"

import { batch, computed, signal } from "@preact/signals"
import { useState, useEffect } from "react"
//import { useWeb3Contract, useMoralis } from "react-moralis"
import { useNetwork } from "wagmi"
//import { useAccount } from "./utils/wagmiAccount"
import { truncateStr } from "./utils/misc"
import { readContract, writeContract, eventContract } from "./utils/wagmiContract"
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit"
import { ethers } from "ethers"
import UpdateListingModal from "./UpdateListingModal"

export default function NFTBox({
    walletAddress,
    price,
    nftAddress,
    tokenId,
    marketplaceAddress,
    seller,
}) {
    const [imageURI, setImageURI] = useState("")
    const [showModal, setShowModal] = useState(false)
    const tokenName = signal("")
    const tokenDescription = signal("")

    const { chain } = useNetwork()
    const dispatch = useNotification()
    const addRecentTransaction = useAddRecentTransaction()
    //const { isWeb3Enabled, account } = useMoralis()
    // const [tokenName, setTokenName] = useState("")
    // const [tokenDescription, setTokenDescription] = useState("")

    async function processTokenURI(tokenURI) {
        //console.log(`The TokenURI is ${tokenURI}`)
        // We are going to cheat a little here...
        if (tokenURI) {
            // IPFS Gateway: A server that will return IPFS files from a "normal" URL.
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await (await fetch(requestURL)).json()
            const imageURIURL = tokenURIResponse.image.replace("ipfs://", "https://ipfs.io/ipfs/")
            // setTokenName(tokenURIResponse.name)
            // setTokenDescription(tokenURIResponse.description)
            batch(() => {
                tokenName.value = tokenURIResponse.name
                tokenDescription.value = tokenURIResponse.description
            })
            setImageURI(imageURIURL)
            // We could render the Image on our sever, and just call our sever.
            // For testnets & mainnet -> use moralis server hooks
            // Have the world adopt IPFS
            // Build our own IPFS gateway

            console.log(`On Contract tokenURI(${tokenId}) Success: `, imageURIURL, `price ${price}`)
        } else {
            console.log(`On Contract tokenURI NULL Success: price ${price}`)
        }
        // get the tokenURI
        // using the image tag from the tokenURI, get the image

        //publish("nftMktPlace_tokenURI", { tokenURI })
    }

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
                enabled: false,
                onSuccess: processTokenURI,
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
        if (rc.isFetched) {
            processTokenURI(rc.data)
        } else if (!rc.isLoading && !rc.isFetching && !rc.isRefetching && basicNftAddresses[0]) {
            console.log("getTokenURI...")
            contractReadRCs[0].refetch()
        }

        return true
    }

    function buyItem() {
        if (writeRCs[0].write) {
            writeRCs[0].write()
        } else if (!basicNftAddresses[0]) {
            console.log("Cannot Buy Item. Reason - BasicNftaddress missing")
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

    const isOwnedByUser =
        seller.toString().toUpperCase() == walletAddress.toString().toUpperCase() ||
        seller === undefined
    const formattedSellerAddress = truncateStr(isOwnedByUser ? "you" : seller, 15)
    const formattedNftAddress = truncateStr(nftAddress, 15)

    const handleCardClick = () => {
        //console.log("isOwnedByUser", isOwnedByUser, "showModal", showModal, "imageURI", imageURI)
        isOwnedByUser && imageURI ? setShowModal(true) : buyItem()
        // : buyItem({
        //       onError: (error) => console.log(error),
        //       onSuccess: handleBuyItemSuccess,
        //   })
    }

    const handleModalClose = () => {
        //console.log("showModal", showModal)
        setShowModal(false)
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
        <div className="mr-2">
            <UpdateListingModal
                isVisible={showModal}
                tokenId={tokenId}
                marketplaceAddress={marketplaceAddress}
                nftAddress={nftAddress}
                onClose={handleModalClose}
            />
            <Card
                title={tokenName.value}
                description={tokenDescription.value}
                onClick={handleCardClick}
            >
                <div className="p-2">
                    <div className="flex flex-col items-end gap-2">
                        <div>#{tokenId}</div>
                        <div className="italic text-sm">Owned by {formattedSellerAddress}</div>
                        <div className="italic text-sm">NftAddress {formattedNftAddress}</div>
                        {(() => {
                            if (imageURI) {
                                return (
                                    <Image
                                        loader={() => imageURI}
                                        src={imageURI}
                                        height="200"
                                        width="200"
                                    />
                                )
                            } else if (getTokenURI()) {
                                return (
                                    <div className="relative h-48 w-48 p-2">
                                        <div className="absolute left-2/4 top-2/4 animate-spin spinner-border h-8 w-8 border-b-2 -ml-4 -mt-4 rounded-full"></div>
                                    </div>
                                )
                            }
                        })()}
                        <div className="font-bold">
                            {ethers.utils.formatUnits(price, "ether")} ETH
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
