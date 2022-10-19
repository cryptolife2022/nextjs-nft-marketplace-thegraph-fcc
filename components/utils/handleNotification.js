const handleNewNotification = (dispatch, title, msg, type, icon, position) => {
    dispatch({
        type: type || "info",
        message: msg,
        title: title,
        icon: icon || "bell",
        position: position || "topR",
    })
}

const handleErrorNotification = (dispatch, title, msg, type, icon, position) => {
    dispatch({
        type: type || "error",
        message: msg,
        title: title,
        icon: icon || "bell",
        position: position || "topR",
    })
}

export { handleErrorNotification, handleNewNotification }
