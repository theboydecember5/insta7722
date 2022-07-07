import React, { useRef } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GLOBALTYPES } from "./redux/actions/globalTypes";
import { NOTIFY_TYPES } from "./redux/actions/notifyAction";
import { POST_TYPES } from "./redux/actions/postAction";
import audiobell from "./audio/mixkit-doorbell-single-press-333.wav";
import { MESS_TYPES } from "./redux/actions/messageAction";

// Notification to device (Notification API javascript)
const spawnNotification = (body, icon, url, title) => {
    let options = {
        body,
        icon,
    };

    let n = new Notification(title, options);
    console.log({ n });
    n.onclick = (e) => {
        e.preventDefault();
        window.open(url, "_blank");
    };
};

const SocketClient = () => {
    const { auth, socket, notify, online, call } = useSelector(state => state);
    const dispatch = useDispatch();

    const audioRef = useRef();

    useEffect(() => {
        // emit gửi dữ liệu, on là nhận dữ liệu trong socketIO

        socket.emit("joinUser", auth.user);
    }, [socket, auth.user]);

    //Likes
    useEffect(() => {
        socket.on("likeToClient", (newPost) => {
            dispatch({ type: POST_TYPES.UPDATE_POST, payload: newPost });
        });
        return () => socket.off("likeToClient");
    }, [socket, dispatch]);
    //Unlikes
    useEffect(() => {
        socket.on("unLikeToClient", (newPost) => {
            dispatch({ type: POST_TYPES.UPDATE_POST, payload: newPost });
        });
        return () => socket.off("unLikeToClient");
    }, [socket, dispatch]);

    //Comments
    useEffect(() => {
        socket.on("createCommentToClient", (newPost) => {
            dispatch({ type: POST_TYPES.UPDATE_POST, payload: newPost });
        });
        return () => socket.off("createCommentToClient");
    }, [socket, dispatch]);

    // DeleteComment
    useEffect(() => {
        socket.on("deleteCommentToClient", (newPost) => {
            dispatch({ type: POST_TYPES.UPDATE_POST, payload: newPost });
        });
        return () => socket.off("deleteCommentToClient");
    }, [socket, dispatch]);

    // Follow
    useEffect(() => {
        socket.on("followToClient", (newUser) => {
            dispatch({ type: GLOBALTYPES.AUTH, payload: { ...auth, user: newUser } });
        });
        return () => socket.off("followToClient");
    }, [socket, dispatch, auth]);

    //Unfollow
    useEffect(() => {
        socket.on("unFollowToClient", (newUser) => {
            dispatch({ type: GLOBALTYPES.AUTH, payload: { ...auth, user: newUser } });
        });
        return () => socket.off("unFollowToClient");
    }, [socket, dispatch, auth]);

    // Notification (Notification API javascript)
    useEffect(() => {
        socket.on("createNotifyToClient", (msg) => {
            dispatch({ type: NOTIFY_TYPES.CREATE_NOTIFY, payload: msg });

            if (notify.sound) audioRef.current.play();

            // Notification to device
            spawnNotification(
                msg.user.username + " " + msg.text,
                msg.user.avatar,
                msg.url,
                "Quang Vinh-NETWORK"
            );
        });
        return () => socket.off("createNotifyToClient");
    }, [socket, dispatch, notify.sound]);

    useEffect(() => {
        socket.on("removeNotifyToClient", (msg) => {
            console.log({ msg });
            dispatch({ type: NOTIFY_TYPES.REMOVE_NOTIFY, payload: msg });
        });
        return () => socket.off("removeNotifyToClient");
    }, [socket, dispatch]);

    // Add messenger realtime notifications
    useEffect(() => {
        socket.on("addMessageToClient", (msg) => {
            console.log({ msg })
            dispatch({ type: MESS_TYPES.ADD_MESSAGE, payload: msg });
            dispatch({ type: MESS_TYPES.ADD_USER, payload: { ...msg.user, text: msg.text, media: msg.media } })
        });

        return () => socket.off("addMessageToClient");
    }, [socket, dispatch]);

    // Check user online / offline

    useEffect(() => {
        socket.emit("checkOnlineUser", auth.user)
    }, [socket, auth.user]);

    useEffect(() => {
        socket.on("checkUserOnlineToMe", data => {
            data.forEach(item => {
                if (!online.includes(item.id)) {
                    dispatch({ type: GLOBALTYPES.ONLINE, payload: item.id })
                }
            })

        });
        return () => socket.off("checkUserOnlineToMe");
    }, [socket, dispatch, online]);


    useEffect(() => {
        socket.on("checkOnlineUserToClient", id => {
            if (!online.includes(id)) {
                dispatch({ type: GLOBALTYPES.ONLINE, payload: id })
            }
        });
        return () => socket.off("checkOnlineUserToClient");
    }, [socket, dispatch, online]);

    // Check User Offline

    useEffect(() => {
        socket.on("checkUserOffline", id => {

            dispatch({ type: GLOBALTYPES.OFFLINE, payload: id })

        });
        return () => socket.off("checkUserOffline");
    }, [socket, dispatch, online]);

    // Call user
    useEffect(() => {
        socket.on("callUserToClient", data => {
            console.log(data)
            dispatch({ type: GLOBALTYPES.CALL, payload: data })
        });

        return () => socket.off("callUserToClient");
    }, [socket, dispatch, online]);


    useEffect(() => {
        socket.on("userBusy", data => {
            dispatch({ type: GLOBALTYPES.ALERT, payload: { error: `${call.username} is busy !` } })
        });

        return () => socket.off("userBusy");
    }, [socket, dispatch, call]);



    return (
        <>
            <audio controls ref={audioRef} style={{ display: 'none' }}>
                <source src={audiobell} type="audio/wav" />
            </audio>
        </>
    );
};

export default SocketClient;
