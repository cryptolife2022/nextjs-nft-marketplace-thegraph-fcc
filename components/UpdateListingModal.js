import { handleErrorNotification, handleNewNotification } from "./utils/handleNotification"
import { truncateStr } from "./utils/misc"
import { Modal, Input, useNotification } from "web3uikit"
import { useState } from "react"
import { useNetwork } from "wagmi"
import { readContract, writeContract, eventContract } from "./utils/wagmiContract"
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit"
//import { useWeb3Contract } from "react-moralis"
//import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { ethers } from "ethers"

import { signal } from "@preact/signals"

const priceToUpdateListingWith = signal(0)

export default function UpdateListingModal({
    nftAddress: basicNftAddress,
    tokenId,
    isVisible,
    marketplaceAddress,
    onClose,
}) {
    const { chain } = useNetwork()
    const dispatch = useNotification()
    const addRecentTransaction = useAddRecentTransaction()

    //const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0)

    /*
    const handleUpdateListingSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "listing updated",
            title: "Listing updated - please refresh (and move blocks)",
            position: "topR",
        })
        onClose && onClose()
        setPriceToUpdateListingWith("0")
    }

    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress: basicNftAddress,
            tokenId: tokenId,
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
        },
    })
    */
    const { writeRCs, isBusy, preWriteRCs } = writeContract(
        [
            {
                contractName: "NftMarketplace",
                func: "updateListing",
                args: [
                    basicNftAddress,
                    tokenId,
                    ethers.utils.parseEther(priceToUpdateListingWith.value || "0"),
                ],
                onError: (error) => {
                    // {code, message}
                    var msg = JSON.parse(
                        error.message
                            .split("[ethjs-query] while formatting outputs from RPC ")[1]
                            .slice(1, -1)
                    ).value.data.message

                    console.log("On Contract NftMarketplace updateListing Error - ", msg)
                    handleErrorNotification(dispatch, "Update NFT Listing Failed", msg)
                },
                onSuccess: (tx) => {
                    ;(async () => {
                        console.log("On Contract NftMarketplace updateListing Success", tx) // {hash, wait}
                        const msg =
                            "Updated NFT List [" +
                            truncateStr(basicNftAddress.toString()) +
                            ", TokenId(" +
                            tokenId +
                            ")]"
                        addRecentTransaction({
                            hash: tx.hash,
                            description: msg,
                            confirmations: 1,
                        })
                        await tx.wait(1)
                        handleNewNotification(dispatch, "Updating NFT Listing", msg)
                    })()
                },
            },
        ],
        chain
    )

    function updateListing() {
        if (writeRCs[0].write) {
            writeRCs[0].write()
        } else {
            // Reason in preWriteRC
            console.log("Cannot Update Listing. writeRCs Reason - ", writeRCs[0].error)
            console.log("preWriteRCs Reason - ", preWriteRCs[0].error)
        }
    }

    function updatePrice(event) {
        priceToUpdateListingWith.value = event.target.value
    }

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={updateListing}
            /*
            () => 
            {
                updateListing({
                    onError: (error) => {
                        console.log(error)
                    },
                    onSuccess: handleUpdateListingSuccess,
                })
            }}
            */
        >
            <Input
                label="Update listing price in L1 Currency (ETH)"
                name="New listing price"
                type="number"
                onChange={updatePrice}
            />
        </Modal>
    )
}
