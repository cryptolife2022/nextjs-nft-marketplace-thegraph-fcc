import constants from "../../constants"
import {
    useContractRead,
    useContractReads,
    useContractWrite,
    usePrepareContractWrite,
    useContractEvent,
} from "wagmi"

// struct method
// {
//     contractName,
//     func,
//     args,
//     enabled,
//     onError,
//     onSuccess,
//     overrides,
// }
export function readContract(methods, chain) {
    let contractReadRCs = [],
        addresses = []
    var isSuccessAll = true

    //console.log("address : ", address)
    methods.forEach((method, index) => {
        /*
        console.log("constants.contractAddresses ", constants.contractAddresses)
        console.log("chain.id ", chain.id)
        console.log("method['contractName'] ", method["contractName"])
        console.log("contractInterface ", constants[method["contractName"] + "Abi"])
        */
        addresses[index] = chain
            ? chain.id in constants.contractAddresses
                ? constants.contractAddresses[chain.id][method["contractName"]][0]
                : 0
            : 0

        const readConfig = {
            address: addresses[index],
            abi: constants[method["contractName"] + "Abi"],
            args: method["args"] || [],
            functionName: method["func"],
            enabled: addresses[index]
                ? true && (method["enabled"] || method["enabled"] == undefined)
                : false,
        }

        /* const { data,isSuccess,isError,isLoading,refetch } = */
        contractReadRCs.push(
            useContractRead({
                ...readConfig,
                onError: method["onError"],
                onSuccess: method["onSuccess"],
            })
        )
    })

    return { contractReadRCs, addresses, isSuccessAll }
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
export function writeContract(methods, chain) {
    let writeRCs = [],
        preWriteRCs = []
    let isBusy = false

    methods.forEach((method, index) => {
        let address = chain
            ? chain.id in constants.contractAddresses
                ? constants.contractAddresses[chain.id][method["contractName"]][0]
                : 0
            : 0
        /*{config,error,isError,isLoading,isFetching}=*/
        preWriteRCs[index] = usePrepareContractWrite({
            address: address,
            abi: constants[method["contractName"] + "Abi"],
            args: method["args"] || [],
            functionName: method["func"],
            overrides: method["overrides"],
        })

        writeRCs.push(
            useContractWrite({
                ...preWriteRCs[index].config,
                onError: method["onError"],
                onSuccess: method["onSuccess"],
            })
        )

        isBusy ||=
            preWriteRCs[index].isLoading ||
            preWriteRCs[index].isFetching ||
            writeRCs[index].isLoading ||
            writeRCs[index].isFetching
    })

    return { writeRCs, isBusy, preWriteRCs }
}

// struct events
// {
//     contractName,
//     eventName,
//     listener,
//     once
// }
export function eventContract(events, chain) {
    events.forEach((event, index) => {
        let address = chain
            ? chain.id in constants.contractAddresses
                ? constants.contractAddresses[chain.id][event.contractName][0]
                : 0
            : 0

        useContractEvent({
            address: address,
            abi: constants[event.contractName + "Abi"],
            eventName: event.eventName,
            once: event.once,
            listener: event.listener, // listener(node, label, owner)
        })
    })
}
