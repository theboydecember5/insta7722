import {
    deleteDataAPI,
    getDataAPI,
    patchDataAPI,
    postDataAPI,
} from "../../utils/fetchData";
import { GLOBALTYPES } from "./globalTypes";

export const NOTIFY_TYPES = {
    GET_NOTIFIES: "GET_NOTIFIES",
    CREATE_NOTIFY: "CREATE_NOTIFY",
    REMOVE_NOTIFY: "REMOVE_NOTIFY",
    UPDATE_NOTIFY: "UPDATE_NOTIFY",
    UPDATE_SOUND: "UPDATE_SOUND",
    DELETE_ALL_NOTIFIES: "DELETE_ALL_NOTIFIES"
};

export const createNotify =
    ({ msg, auth, socket }) =>
        async (dispatch) => {
            try {
                const res = await postDataAPI("notify", msg, auth.token);

                socket.emit("createNotify", {
                    ...res.data.notify,
                    user: {
                        username: auth.user.username,
                        avatar: auth.user.avatar,
                    },
                });
            } catch (error) {
                dispatch({
                    type: GLOBALTYPES.ALERT,
                    payload: { error: error.response.data.msg },
                });
            }
        };

export const removeNotify =
    ({ msg, auth, socket }) =>
        async (dispatch) => {
            try {
                const res = await deleteDataAPI(
                    `notify/${msg.id}?url=${msg.url}`,
                    auth.token
                );
                console.log(res);
                socket.emit("removeNotify", msg);
            } catch (error) {
                dispatch({
                    type: GLOBALTYPES.ALERT,
                    payload: { error: error.response.data.msg },
                });
            }
        };

export const getNotifies = (token) => async (dispatch) => {
    try {
        const res = await getDataAPI("notifies", token);
        dispatch({ type: NOTIFY_TYPES.GET_NOTIFIES, payload: res.data.notifies });
    } catch (error) {
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { error: error.response.data.msg },
        });
    }
};

export const isReadNotify =
    ({ msg, auth }) =>
        async (dispatch) => {
            dispatch({
                type: NOTIFY_TYPES.UPDATE_NOTIFY,
                payload: { ...msg, isRead: true },
            });

            try {
                const notify = await patchDataAPI(
                    `isReadNotify/${msg._id}`,
                    null,
                    auth.token
                );
            } catch (error) {
                dispatch({
                    type: GLOBALTYPES.ALERT,
                    payload: { error: error.response.data.msg },
                });
            }
        };

export const deleteAllNotifies = (token) => async (dispatch) => {
    dispatch({type: NOTIFY_TYPES.DELETE_ALL_NOTIFIES, payload: []})

    try {
        await deleteDataAPI('deleteAllNotify', token)
    } catch (error) {
        dispatch({
            type: GLOBALTYPES.ALERT,
            payload: { error: error.response.data.msg },
        });
    }
}