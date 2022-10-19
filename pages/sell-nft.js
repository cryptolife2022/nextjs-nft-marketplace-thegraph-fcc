import styles from "../styles/Home.module.css"

import constants from "../constants"
import { useIsSSR } from "../components/utils/events"
import {
    handleErrorNotification,
    handleNewNotification,
} from "../components/utils/handleNotification"
import { readContract, writeContract, eventContract } from "../components/utils/wagmiContract"
//import LotteryEntrance from "../components/LotteryEntrance"
import { useAccount } from "../components/utils/wagmiAccount"
import { useNetwork, useSwitchNetwork } from "wagmi"

import { Form, useNotification, Button } from "web3uikit"
import { UniswapWidget } from "../components/UniswapWidget"
//import { useMoralis, useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import { useEffect, useState } from "react"

export default function Home() {
    // UI Hydration Bug fix
    // Not neccessary with signals
    const isSSR = useIsSSR()

    const { address: account, isConnected } = useAccount()
    const { chain } = useNetwork()
    const dispatch = useNotification()

    const [proceeds, setProceeds] = useState("0")
    const [nftAddress, setNftAddress] = useState("")
    const [tokenId, setTokenId] = useState("")
    const [price, setPrice] = useState("")

    //event NftMarketplace__WithdrewProceeds(address indexed seller, uint256 amount);
    eventContract(
        [
            {
                contractName: "NftMarketplace",
                eventNamae: "NftMarketplace__WithdrewProceeds",
                once: false,
                listener: (event) => {
                    const rc = event[1].args
                    // Not related to the current Wallet Owner
                    if (rc["seller"].toString() != account.toString()) {
                        console.log(
                            "Event WithdrewProceeds for account(" + rc["seller"] + ") IGNORED"
                        )
                        return
                    }
                    const msg =
                        "Account " +
                        rc["seller"].toString() +
                        " Withdrew " +
                        ethers.utils.formatUnits(rc["amount"], "ether") +
                        " ETH"
                    console.log(msg, event)
                    // Prevent old events from coming through the queue ...

                    // Notify User
                    handleNewNotification(dispatch, "Withdraw Proceeds", msg)
                    // Update Stats on screen
                    // updateUI(false,[false,true,true])
                },
            },
        ],
        chain
    )

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
                contractName: "NftMarketplace",
                func: "getProceedsEarned",
                args: [account],
                enabled: false,
                onError: (error) => {
                    console.log(`On Contract NftMarketplace ${account} getProceedsEarned ${error}`)
                },
                onSuccess: async (data) => {
                    setProceeds(data.toString())
                    console.log(
                        `On Contract NftMarketplace getProceedsEarned Success: ${ethers.utils.formatUnits(
                            data,
                            "ether"
                        )}`
                    )
                    //publish("nftMktPlace_getProceedsEarned", { data })
                },
            },
        ],
        chain
    )

    //const { runContractFunction } = useWeb3Contract()
    const { writeRCs, isBusy, preWriteRCs } = writeContract(
        [
            {
                contractName: "BasicNft",
                func: "approve",
                //args: [marketplaceAddress, tokenId],
                onError: (error) => {
                    // {code, message}
                    var msg = JSON.parse(
                        error.message
                            .split("[ethjs-query] while formatting outputs from RPC ")[1]
                            .slice(1, -1)
                    ).value.data.message

                    console.log("On BasicNft Contract approve Error - ", msg)
                    handleErrorNotification(dispatch, "NFT Approval Failed", msg)
                },
                onSuccess: (tx) => {
                    ;(async () => {
                        console.log("On BasicNft Contract approve Success", tx) // {hash, wait}
                        addRecentTransaction({
                            hash: tx.hash,
                            description:
                                "Approved NFT [" +
                                nftAddress.toString() +
                                ", TokenId(" +
                                tokenId +
                                ")]",
                            confirmations: 1,
                        })
                        await tx.wait(1)
                        listItem()
                    })()
                },
            },
            {
                contractName: "NftMarketplace",
                func: "listItem",
                //args: [nftAddress, tokenId, price],
                onError: (error) => {
                    // {code, message}
                    var msg = JSON.parse(
                        error.message
                            .split("[ethjs-query] while formatting outputs from RPC ")[1]
                            .slice(1, -1)
                    ).value.data.message

                    console.log("On NftMarketplace Contract listItem Error - ", msg)
                    handleErrorNotification(dispatch, "Listing to NFT Marketplace Failed", msg)
                },
                onSuccess: (tx) => {
                    ;(async () => {
                        console.log("On NftMarketplace Contract listItem Success", tx) // {hash, wait}
                        addRecentTransaction({
                            hash: tx.hash,
                            description:
                                "NFT Marketplace Listed Item [" +
                                nftAddress.toString() +
                                ", TokenId(" +
                                tokenId +
                                ")]",
                            confirmations: 1,
                        })
                        await tx.wait(1)
                        handleNewNotification(
                            dispatch,
                            "NFT List Item",
                            "Listed NFT [" +
                                nftAddress.toString() +
                                ", TokenId(" +
                                tokenId +
                                "), Price(" +
                                ethers.utils.formatUnits(price, "ether") +
                                ")]"
                        )
                    })()
                },
            },
            {
                contractName: "NftMarketplace",
                func: "withdrawProceeds",
                onError: (error) => {
                    // {code, message}
                    var msg = JSON.parse(
                        error.message
                            .split("[ethjs-query] while formatting outputs from RPC ")[1]
                            .slice(1, -1)
                    ).value.data.message

                    console.log("On NftMarketplace Contract withdrawProceeds Error - ", msg)
                    handleErrorNotification(
                        dispatch,
                        "WithdrawProceeds from NFT Marketplace Failed",
                        msg
                    )
                },
                onSuccess: (tx) => {
                    ;(async () => {
                        console.log("On NftMarketplace Contract withdrawProceeds Success", tx) // {hash, wait}
                        addRecentTransaction({
                            hash: tx.hash,
                            description:
                                "WithdrawProceeds (" +
                                ethers.utils.formatUnits(price, "ether") +
                                " ETH)",
                            confirmations: 1,
                        })
                        await tx.wait(1)
                    })()
                },
            },
        ],
        chain
    )

    function getProceedsEarned() {
        const rc = contractReadRCs[0]

        //console.log("contractReadRCs[0]...", rc)
        if (!rc.isLoading && !rc.isFetching && !rc.isRefetching) {
            console.log("getProceedsEarned...")
            rc.refetch()
        }
    }

    function getApprove(data) {
        console.log("Approving...")
        const chainString = chain?.id ? parseInt(chain.id).toString() : "31337"
        //const { chainId, account, isWeb3Enabled } = useMoralis()
        const marketplaceAddress = chain
            ? chain.id in constants.contractAddresses
                ? constants.contractAddresses[chainString]["NftMarketplace"][0]
                : 0
            : 0
        //const marketplaceAddress = networkMapping[chainString].NftMarketplace[0]

        setNftAddress(data.data[0].inputResult)
        setTokenId(data.data[1].inputResult)
        setPrice(ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString())
        if (writeRCs[0].write) {
            writeRCs[0].write({
                args: [marketplaceAddress, tokenId],
                /*
                overrides: {
                    gasPrice: 10000000,
                },
                */
            })
        } else {
            // Reason in preWriteRC
            console.log("Cannot Approve NFT. writeRCs Reason - ", preWriteRCs[0].error)
            console.log("preWriteRCs Reason - ", preWriteRCs[0].error)
        }
        /*
        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: marketplaceAddress,
                tokenId: tokenId,
            },
        }

        await runContractFunction({
            params: approveOptions,
            onSuccess: (tx) => handleApproveSuccess(tx, nftAddress, tokenId, price),
            onError: (error) => {
                console.log(error)
            },
        })
        */
    }

    function listItem() {
        console.log("listItem...")
        if (writeRCs[1].write) {
            writeRCs[1].write({ args: [nftAddress, tokenId, price] })
        } else {
            // Reason in preWriteRC
            console.log("Cannot ListItem. writeRCs Reason - ", preWriteRCs[1].error)
            console.log("preWriteRCs Reason - ", preWriteRCs[1].error)
        }
    }

    function withdrawProceeds() {
        console.log("withdrawProceeds...")
        if (writeRCs[2].write) {
            writeRCs[2].write()
        } else {
            // Reason in preWriteRC
            console.log("Cannot Withdraw Proceeds. writeRCs Reason - ", preWriteRCs[2].error)
            console.log("preWriteRCs Reason - ", preWriteRCs[2].error)
        }
    }

    /*
    async function handleApproveSuccess(nftAddress, tokenId, price) {
        console.log("Ok! Now time to list")
        await tx.wait()
        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price,
            },
        }

        await runContractFunction({
            params: listOptions,
            onSuccess: () => handleListSuccess(),
            onError: (error) => console.log(error),
        })
    }

    async function handleListSuccess() {
        dispatch({
            type: "success",
            message: "NFT listing",
            title: "NFT listed",
            position: "topR",
        })
    }

    const handleWithdrawSuccess = () => {
        dispatch({
            type: "success",
            message: "Withdrawing proceeds",
            position: "topR",
        })
    }
    */

    useEffect(() => {
        if (isConnected) {
            getProceedsEarned()
        }
        /*
        const returnedProceeds = await runContractFunction({
            params: {
                abi: nftMarketplaceAbi,
                contractAddress: marketplaceAddress,
                functionName: "getProceeds",
                params: {
                    seller: account,
                },
            },
            onError: (error) => console.log(error),
        })
        if (returnedProceeds) {
            setProceeds(returnedProceeds.toString())
        }
        */
    }, [proceeds, account, isConnected, chain])

    return (
        <div className={styles.container}>
            <div className="float-left">
                {!isSSR && account && isConnected ? (
                    <Form
                        onSubmit={getApprove}
                        data={[
                            {
                                name: "NFT Address",
                                type: "text",
                                inputWidth: "50%",
                                value: "",
                                key: "nftAddress",
                            },
                            {
                                name: "Token ID",
                                type: "number",
                                value: "",
                                key: "tokenId",
                            },
                            {
                                name: "Price (in ETH)",
                                type: "number",
                                value: "",
                                key: "price",
                            },
                        ]}
                        title="Sell your NFT!"
                        id="Main Form"
                    />
                ) : (
                    <></>
                )}
                {!isSSR && account && isConnected && parseInt(proceeds) > 0 ? (
                    <div className="float-left">
                        <div className="align-middle">
                            Withdraw {ethers.utils.formatUnits(proceeds)} proceeds
                        </div>
                        <Button
                            className=""
                            onClick={
                                withdrawProceeds
                                /*
                                () => {
                                runContractFunction({
                                    params: {
                                        abi: nftMarketplaceAbi,
                                        contractAddress: marketplaceAddress,
                                        functionName: "withdrawProceeds",
                                        params: {},
                                    },
                                    onError: (error) => console.log(error),
                                    onSuccess: () => handleWithdrawSuccess,
                                })
                            }}
                             */
                            }
                            text="Withdraw"
                            type="button"
                        />
                    </div>
                ) : (
                    <div>No proceeds detected</div>
                )}
            </div>
            <UniswapWidget />
        </div>
    )
}
