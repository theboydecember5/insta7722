import { MESS_TYPES } from "../actions/messageAction"

const initialState = {
    users: [],
    resultUsers: 0,
    data: [],
    firstLoad: false,
}

export const EditData = (data, id, post) => {
    const newData = data.map(item =>
        (item._id === id ? post : item)
    )
    return newData;
}

export const DeleteData = (data, id) => {
    const newData = data.filter(item => item._id !== id)
    return newData;
}

const messageReducer = (state = initialState, action) => {
    switch (action.type) {
        case MESS_TYPES.ADD_USER:

            if (state.users.every(item => item._id !== action.payload._id)) {
                return {
                    ...state,
                    users: [action.payload, ...state.users]
                }
            }

            return state

        // return { 
        //     ...state,
        //     users: [action.payload, ...state.users]
        // }
        case MESS_TYPES.ADD_MESSAGE:
            return {
                ...state,
                data: state.data.map(item =>
                    item._id === action.payload.sender || item._id === action.payload.recipient
                        ? {
                            ...item,
                            messages: [...item.messages, action.payload],
                            result: item.result + 1
                        }
                        : item
                ),
                users: state.users.map(user =>
                    user._id === action.payload.recipients || user._id === action.payload.sender
                        ? { ...user, text: action.payload.text, media: action.payload.media }
                        : user)
            }
        case MESS_TYPES.GET_CONVERSATION:
            return {
                ...state,
                users: action.payload.newArr,
                resultUsers: action.payload.result,
                firstLoad: true
            }
        case MESS_TYPES.GET_MESSAGES:
            return {
                ...state,
                data: [...state.data, action.payload]
            }
        case MESS_TYPES.UPDATE_MESSAGES:
            return {
                ...state,
                data: EditData(state.data, action.payload._id, action.payload)
            }
        case MESS_TYPES.DELETE_MESSAGES:
            return {
                ...state,
                data: state.data.map(item =>
                    item._id === action.payload._id ?
                        { ...item, messages: action.payload.newData }
                        : item)
            }
        case MESS_TYPES.DELETE_CONVERSATION:
            return {
                ...state,
                data: DeleteData(state.data, action.payload),
                users: DeleteData(state.users, action.payload),
            }
        case MESS_TYPES.CHECK_ONLINE_OFFLINE:

            return {
                ...state,
                users: state.users.map(user => action.payload.includes(user._id)
                    ? { ...user, online: true }
                    : { ...user, online: false }
                )
            }

        default:
            return state
    }
}

export default messageReducer