import { useQuery } from "@apollo/client"
import constants from "../constants"

export default function GraphExample() {
    const queries = constants.QUERIES
    //console.log(queries)
    const rc = useQuery(queries.get_active_items, {
        variables: { buyerAddress: queries.NO_BUYER },
    })
    console.log(rc.data)
    return <div>hi</div>
}
