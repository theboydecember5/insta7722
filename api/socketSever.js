

let users = []

const EditData = (data, id, call) => {
    const newData = data.map(item => item.id === id ?
        { ...item, call } : item
    )
    return newData
}

const SocketSever = (socket) => {

    socket.on('joinUser', user => {
        users.push({ id: user._id, socketId: socket.id, followers: user.followers })
        console.log(users)
    })


    //Likes 
    socket.on('likePost', newPost => {
        const ids = [...newPost.user.followers, newPost.user._id]


        const clients = users.filter(user => ids.includes(user.id))
        console.log(clients)

        if (clients.length > 0) {
            clients.forEach(client => {
                socket.to(`${client.socketId}`).emit('likeToClient', newPost)
            })
        }
    })


    //Unlikes
    socket.on('unLikePost', newPost => {
        const ids = [...newPost.user.followers, newPost.user._id]
        const clients = users.filter(user => ids.includes(user.id))

        if (clients.length > 0) {
            clients.forEach(client => {
                socket.to(`${client.socketId}`).emit('unLikeToClient', newPost)
            })
        }
    })


    //Comment
    socket.on('createComment', newPost => {

        const ids = [...newPost.user.followers, newPost.user._id]
        const clients = users.filter(user => ids.includes(user.id))
        console.log(clients)

        if (clients.length > 0) {
            clients.forEach(client => {
                socket.to(`${client.socketId}`).emit('createCommentToClient', newPost)
            })
        }
    })

    // Delete Comment
    socket.on('deleteComment', newPost => {

        const ids = [...newPost.user.followers, newPost.user._id]
        const clients = users.filter(user => ids.includes(user.id))
        console.log(clients)

        if (clients.length > 0) {
            clients.forEach(client => {
                socket.to(`${client.socketId}`).emit('deleteCommentToClient', newPost)
            })
        }
    })

    // Follow
    socket.on('follow', newUser => {
        const user = users.find(user => user.id === newUser._id)
        user && socket.to(`${user.socketId}`).emit('followToClient', newUser)
    })

    //UnFollow
    socket.on('unFollow', newUser => {
        const user = users.find(user => user.id === newUser._id)
        user && socket.to(`${user.socketId}`).emit('unFollowToClient', newUser)
    })

    //Notification
    socket.on('createNotify', msg => {
        const clients = users.filter(user => msg.recipients.includes(user.id))
        if (clients.length > 0) {
            clients.forEach(client => {
                socket.to(`${client.socketId}`).emit('createNotifyToClient', msg)
            })
        }
    })

    socket.on('removeNotify', msg => {
        const clients = users.filter(user => msg.recipients.includes(user.id))

        if (clients.length > 0) {
            clients.forEach(client => {
                socket.to(`${client.socketId}`).emit('removeNotifyToClient', msg)
            })
        }
    })

    socket.on('addMessage', msg => {

        const user = users.find(user => user.id === msg.recipient)
        user && socket.to(`${user.socketId}`).emit('addMessageToClient', msg)
    })

    // Check online or offline

    socket.on('checkOnlineUser', data => {
        // Tìm các phần tử giống nhau giữa 2 mảng

        const following = users.filter(user =>
            data.following.find(item => item._id === user.id)
        )
        socket.emit('checkUserOnlineToMe', following)

        const clients = users.filter(user =>
            data.followers.find(item => item._id === user.id)
        )

        if (clients.length > 0) {
            clients.forEach(client =>
                socket.to(`${client.socketId}`).emit('checkOnlineUserToClient', data._id))
        }

    })

    //Call
    socket.on('callUser', data => {
        // (data, id, call)
        // newData = data.map(item => item.id === id ?
        //     { ...item, call } : item

        users = EditData(users, data.sender, data.recipient)

        // Tìm user được gọi đến
        const client = users.find(user => user.id === data.recipient)


        if (client) {
            if (client.call) {
                users = EditData(users, data.sender, null)
                socket.emit('userBusy', data)
            } else {
                users = EditData(users, data.recipient, data.sender)
                socket.to(`${client.socketId}`).emit('callUserToClient', data)
            }
        }

    })


    socket.on('endCall', data => {

        const client = users.find(user => user.id === data.sender)

        if (client) {
            socket.to(`${client.socketId}`).emit('endCallToClient', data)
            users = EditData(users, client.id, null)

            if (client.call) {
                const clientCall = users.find(user => user.id === client.call)
                clientCall && socket.to(`${clientCall.socketId}`).emit('endCallToClient', data)
                users = EditData(users, client.call, null)
            }
        }


    })


    socket.on('disconnect', () => {
        const data = users.find(user => user.socketId === socket.id)

        if (data) {
            const clients = users.filter(user =>
                data.followers.find(item => item._id === user.id))

            if (clients.length > 0) {
                clients.forEach(client => {
                    socket.to(`${client.socketId}`).emit('checkUserOffline', data.id)
                })
            }

            if (data.call) {
                const callUser = users.find(user => user.id === data.call)
                if(callUser){
                    users = EditData(users, callUser.id, null)
                    socket.to(`${callUser.socketId}`).emit('callerDisconnect')
                }
            }

        }

        users.filter(user => user.socketId !== socket.id)
    })
}

module.exports = SocketSever