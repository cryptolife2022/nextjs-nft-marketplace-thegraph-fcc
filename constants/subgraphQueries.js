import { gql } from "@apollo/client"

const QUERIES = {
    NO_BUYER: "0x0000000000000000000000000000000000000000",
    get_active_items: gql`
        query GetActiveItems($buyerAddress: String!) {
            nftMarketplaceActiveItems(first: 5, where: { buyer: $buyerAddress }) {
                id
                buyer
                seller
                nftAddress
                tokenId
                price
            }
        }
    `,
}

export default QUERIES
