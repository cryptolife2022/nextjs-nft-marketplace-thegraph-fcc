const contractAddresses = require("./networkMapping.json")
const BasicNftAbi = require("./BasicNft.json")
const NftMarketplaceAbi = require("./NftMarketplace.json")
import GET_ACTIVE_ITEMS from "./subgraphQueries"
const appName = "Nft Marketplace"
const favIcon = "/favicon.ico"
const userPage = "/user"
const signOutRedirectPath = "/"
const signInPage = "/"
const loginRequestPath = "/api/auth/request-message"

module.exports = {
    userPage,
    signOutRedirectPath,
    signInPage,
    appName,
    favIcon,
    contractAddresses,
    BasicNftAbi,
    NftMarketplaceAbi,
    GET_ACTIVE_ITEMS,
    loginRequestPath,
}
