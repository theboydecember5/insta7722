import { deleteDataAPI, getDataAPI, patchDataAPI, postDataAPI } from "../../utils/fetchData"
import { imageUpload } from "../../utils/imageUpload"
import { GLOBALTYPES } from "./globalTypes"
import { createNotify, removeNotify } from "./notifyAction"

export const POST_TYPES = {
    CREATE_POST: 'CREATE_POST',
    LOADING_POST: 'LOADING_POST',
    GET_POSTS: 'GET_POSTS',
    UPDATE_POST: 'UPDATE_POST',
    GET_POST: 'GET_POST',
    DELETE_POST: 'DELETE_POST'
}

export const createPost = ({ content, images, auth, socket }) => async (dispatch) => {
    let media = []
    try {

        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } })
        if (images.length > 0) media = await imageUpload(images)
        const res = await postDataAPI('posts', { content, images: media }, auth.token)

        dispatch({ type: POST_TYPES.CREATE_POST, payload: { ...res.data.newPost, user: auth.user } })
        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: false } })

        //Notify
        const msg = {
            id: res.data.newPost._id,
            text: 'Đã thêm một bài viết mới !',
            recipients: res.data.newPost.user.followers,
            url: `/post/${res.data.newPost._id}`,
            content: content,
            image: media[0].url
        }

        dispatch(createNotify({ msg, auth, socket }))

    } catch (error) {
        dispatch({
            type: GLOBALTYPES.ALERT, payload: { error: error.response.data.msg }
        })

    }
}

export const getPost = (token) => async (dispatch) => {

    try {
        dispatch({ type: POST_TYPES.LOADING_POST, payload: true })

        const res = await getDataAPI('posts', token)

        dispatch({
            type: POST_TYPES.GET_POSTS,
            payload: { ...res.data, page: 2 }
        })

        dispatch({ type: POST_TYPES.LOADING_POST, payload: false })

    } catch (error) {
        dispatch({
            type: GLOBALTYPES.ALERT, payload: { error: error.response.data.msg }
        })
    }
}

export const updatePost = ({ content, images, auth, status }) => async (dispatch) => {
    let media = []
    const imgNewUrl = images.filter(img => !img.url)
    const imgOldUrl = images.filter(img => img.url)

    console.log({ imgNewUrl, imgOldUrl })

    if (status.content === content
        && imgNewUrl.length === 0
        && imgOldUrl.length === status.images.length)
        return;

    try {
        dispatch({ type: GLOBALTYPES.ALERT, payload: { loading: true } })
        if (imgNewUrl.length > 0) media = await imageUpload(imgNewUrl)

        const res = await patchDataAPI(`post/${status._id}`,
            { content, images: [...imgOldUrl, ...media] },
            auth.token
        )
        dispatch({
            type: POST_TYPES.UPDATE_POST,
            payload: res.data.newPost
        })

        dispatch({ type: GLOBALTYPES.ALERT, payload: { success: res.data.msg } })
    } catch (error) {
        dispatch({
            type: GLOBALTYPES.ALERT, payload: { error: error.response.data.msg }
        })
    }
}

export const likePost = ({ post, auth, socket }) => async (dispatch) => {

    const newPost = { ...post, likes: [...post.likes, auth.user] }

    dispatch({ type: POST_TYPES.UPDATE_POST, payload: newPost })

    // Send to Socket
    socket.emit('likePost', newPost)

    try {
        await patchDataAPI(`post/${post._id}/like`, null, auth.token)

        const msg = {
            id: auth.user._id,
            text: 'like your post !',
            recipients: [post.user._id],
            url: `/post/${post._id}`,
            content: post.content,
            image: post.images[0].url
        }

        dispatch(createNotify({ msg, auth, socket }))

    } catch (error) {
        dispatch({
            type: GLOBALTYPES.ALERT, payload: { error: error.response.data.msg }
        })
    }
}
export const unLikePost = ({ post, auth, socket }) => async (dispatch) => {

    const newPost = { ...post, likes: post.likes.filter(like => like._id !== auth.user._id) }

    dispatch({ type: POST_TYPES.UPDATE_POST, payload: newPost })

    //SocketClient       
    socket.emit('unLikePost', newPost)

    try {
        await patchDataAPI(`post/${post._id}/unlike`, null, auth.token)

        const msg = {
            id: auth.user._id,
            text: 'like your post !',
            recipients: [post.user._id],
            url: `/post/${post._id}`,
        }

        // Delete notify on server and emit socket to realtime 
        // Dispatch 
        const res = await deleteDataAPI(`notify/${msg.id}?url=${msg.url}`, auth.token)
        console.log(res)
        socket.emit('removeNotify', msg)

    } catch (error) {
        dispatch({
            type: GLOBALTYPES.ALERT, payload: { error: error.response.data.msg }
        })
    }
}


export const get1Post = ({ detailPost, id, auth }) => async (dispatch) => {
    if (detailPost.every(post => post._id !== id)) {
        try {
            const res = await getDataAPI(`post/${id}`, auth.token)
            dispatch({ type: POST_TYPES.GET_POST, payload: res.data.post })
        } catch (error) {
            dispatch({
                type: GLOBALTYPES.ALERT, payload: { error: error.response.data.msg }
            })
        }
    }
}

export const deletePost = ({ post, auth, socket }) => async (dispatch) => {
    dispatch({ type: POST_TYPES.DELETE_POST, payload: post })
    try {
        const res = await deleteDataAPI(`post/${post._id}`, auth.token)

        //Notify
        const msg = {
            id: post._id,
            text: 'Đã xóa bài đăng !',
            recipients: res.data.newPost.user.followers,
            url: `/post/${post._id}`
        }

        dispatch(removeNotify({ msg, auth, socket }))

    } catch (error) {
        dispatch({
            type: GLOBALTYPES.ALERT, payload: { error: error.response.data.msg }
        })
    }
}
export const savePost = ({ post, auth }) => async (dispatch) => {

    // const newUser = { ...auth.user }
    // newUser.saved.push(post._id)

    const newUser = { ...auth.user, saved: [...auth.user.saved, post._id] }
    dispatch({ type: GLOBALTYPES.AUTH, payload: { ...auth, user: newUser } })
    try {
        await patchDataAPI(`savePost/${post._id}`, null, auth.token)
    } catch (error) {
        dispatch({
            type: GLOBALTYPES.ALERT, payload: { error: error.response.data.msg }
        })
    }
}
export const unSavePost = ({ post, auth }) => async (dispatch) => {

    const newUser = { ...auth.user, saved: auth.user.saved.filter(id => id !== post._id) }
    dispatch({ type: GLOBALTYPES.AUTH, payload: { ...auth, user: newUser } })

    try {
        await patchDataAPI(`unSavePost/${post._id}`, null, auth.token)
    } catch (error) {
        dispatch({
            type: GLOBALTYPES.ALERT, payload: { error: error.response.data.msg }
        })
    }
}
