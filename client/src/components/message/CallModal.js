import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GLOBALTYPES } from "../../redux/actions/globalTypes";
import Avatar from "../Avatar";

const CallModal = () => {
    const { call, auth, peer, socket } = useSelector((state) => state);
    const dispatch = useDispatch();

    const [hours, setHours] = useState(0)
    const [mins, setMins] = useState(0);
    const [second, setSecond] = useState(0);
    const [total, setTotal] = useState(0);
    const [answer, setAnswer] = useState(false);
    const youVideo = useRef()
    const otherVideo = useRef()

    const [tracks, setTracks] = useState(null)


    // Set time
    useEffect(() => {
        const setTime = () => {
            setTotal(t => t + 1)
            setTimeout(setTime, 1000)
        }
        setTime()
        return () => setTotal(0)
    }, [])

    useEffect(() => {
        setSecond(total % 60)
        setMins(parseInt(total / 60))
        setHours(parseInt(total / 3600))
    }, [total])


    const handleEndCall = () => {
        tracks && tracks.forEach(track => track.stop())
        socket.emit('endCall', call)
        dispatch({ type: GLOBALTYPES.CALL, payload: null })
    }

    useEffect(() => {
        socket.on('endCallToClient', data => {
            console.log(data)

            tracks && tracks.forEach(track => track.stop())

            dispatch({ type: GLOBALTYPES.CALL, payload: null })
        })
        return () => socket.off('endCallToClient')
    }, [dispatch, socket, tracks])


    //Sau 15s không nghe điện thoại thì tự tắt
    useEffect(() => {
        if (answer) {
            setTotal(0)
        } else {
            const timer = setTimeout(() => {
                socket.emit('endCall', call)
                dispatch({ type: GLOBALTYPES.CALL, payload: null })
            }, 15000)
            return () => clearTimeout(timer)
        }
    }, [dispatch, answer, call, socket])

    const handleAnswer = () => {
        openStream(call.video).then(stream => {
            playStream(youVideo.current, stream)

            const track = stream.getTracks()
            setTracks(track)

            const newCall = peer.call(call.peerId, stream)
            newCall.on('stream', function (remoteStream) {
                playStream(otherVideo.current, remoteStream)
            })

            setAnswer(true)
        })
    }

    useEffect(() => {
        peer.on('call', newCall => {
            openStream(call.video).then(stream => {
                if (youVideo.current) {
                    playStream(youVideo.current, stream)
                }

                const track = stream.getTracks()
                setTracks(track)

                newCall.answer(stream)
                newCall.on('stream', function (remoteStream) {
                    if (otherVideo.current) {
                        playStream(otherVideo.current, remoteStream)
                    }
                })
                setAnswer(true)
            })
        })
        return () => peer.removeListener('call')
    }, [peer, call.video])


    const openStream = (video) => {
        const config = { audio: true, video }
        return navigator.mediaDevices.getUserMedia(config)
    }

    const playStream = (tag, stream) => {
        let video = tag
        video.srcObject = stream
        video.play()
    }

    //Disconnect
    useEffect(() => {
        socket.on('callerDisconnect', () => {
            tracks && tracks.forEach(track => track.stop())
            dispatch({ type: GLOBALTYPES.CALL, payload: null })
            dispatch({ type: GLOBALTYPES.ALERT, payload: { error: 'The user disconnected' } })
        })
        return () => socket.off('callerDisconnect')
    }, [socket, tracks, dispatch])

    return (
        <div className="call_modal">
            <div className="call_box" style={{ display: (answer && call.video) ? 'none' : 'flex' }}>
                <div className='text-center' style={{ padding: '40px 0' }}>
                    <Avatar src={call.avatar} size="supper-avatar" />
                    <h4>{call.username}</h4>
                    <h6>{call.fullname}</h6>


                    {
                        answer
                            ? <div>
                                <span>{hours.toString().length < 2 ? "0" + hours : hours}</span>
                                <span>:</span>
                                <span>{mins.toString().length < 2 ? "0" + mins : mins}</span>
                                <span>:</span>
                                <span>{second.toString().length < 2 ? "0" + second : second}</span>
                            </div>
                            : <div>
                                {call.video ? (
                                    <span>Calling video ... </span>
                                ) : (
                                    <span>Calling audio ... </span>
                                )}

                            </div>
                    }

                </div>

                {
                    !answer &&
                    <div className="timer">
                        <small>{mins.toString().length < 2 ? "0" + mins : mins}</small>
                        <small>:</small>
                        <small>{second.toString().length < 2 ? "0" + second : second}</small>
                    </div>
                }


                <div className="call_menu">

                    <span className='material-icons text-danger'
                        onClick={handleEndCall}>
                        <i className="fa-solid fa-phone-slash"></i>
                    </span>

                    {
                        (call.recipient === auth.user._id && !answer) &&
                        <>
                            {
                                call.video ?
                                    <span className="text-success"
                                        onClick={handleAnswer}>
                                        <i className="fa-solid fa-video"></i>
                                    </span>
                                    :
                                    <span className="text-success"
                                        onClick={handleAnswer}>
                                        <i className="fa-solid fa-phone-flip"></i>
                                    </span>
                            }
                        </>
                    }

                </div>


            </div>

            <div className="show_video" style={{
                opacity: (answer && call.video) ? 1 : 0
            }}>
                <video ref={youVideo} className='you_video' />
                <video ref={otherVideo} className='other_video' />

                <div className="time_video">
                    <span>{hours.toString().length < 2 ? "0" + hours : hours}</span>
                    <span>:</span>
                    <span>{mins.toString().length < 2 ? "0" + mins : mins}</span>
                    <span>:</span>
                    <span>{second.toString().length < 2 ? "0" + second : second}</span>
                </div>

                <span className='material-icons text-danger end_call'
                    onClick={handleEndCall}>
                    <i className="fa-solid fa-phone-slash"></i>
                </span>

            </div>
        </div>
    );
};

export default CallModal;
