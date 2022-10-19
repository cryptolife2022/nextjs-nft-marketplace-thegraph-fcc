import { gql } from "@apollo/client"

const NO_BUYER = "0x0000000000000000000000000000000000000000"

const GET_ACTIVE_ITEMS = gql`
    {
        nftMarketplaceActiveItems(
            first: 5
            where: { buyer: "0x0000000000000000000000000000000000000000" }
        ) {
            id
            buyer
            seller
            nftAddress
            tokenId
            price
        }
    }
`
export default GET_ACTIVE_ITEMS
