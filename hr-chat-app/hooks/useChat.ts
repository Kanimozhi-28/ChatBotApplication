import { useEffect, useState, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { getToken } from "@/lib/auth"
import api from "@/lib/api"
import toast from "react-hot-toast"

export interface ChatMessage {
    id?: number
    sender_id: number
    sender_type: "admin" | "candidate"
    message: string
    created_at?: string
}

export function useChat(targetId: number, targetType: "admin" | "candidate") {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const socketRef = useRef<Socket | null>(null)
    const [currentUser, setCurrentUser] = useState<{ id: number; type: string } | null>(null)

    useEffect(() => {
        // 1. Get current user info from token
        const token = getToken()
        if (!token) return

        try {
            const jwt = require("jwt-decode")
            const decoded: any = jwt.jwtDecode(token)
            setCurrentUser({ id: decoded.sub, type: decoded.type })
        } catch (e) {
            console.error("Token decode failed", e)
        }

        // 2. Load initial history
        // If we are candidate, targetId is usually 0 (single admin) but messages endpoint expects candidateId.
        // backend: GET /api/chat/messages/:candidateId
        // If I am admin, I pass targetId (candidateId).
        // If I am candidate, I pass my own ID.
        const fetchHistory = async () => {
            // Logic: if current is admin, fetch messages for targetId (candidate).
            // If current is candidate, fetch messages for self.
            // The backend endpoint is /messages/{candidate_id}.

            let candidateIdForApi = targetId
            // Wait, if I am candidate, targetId is admin (id 1?). 
            // The hook usage:
            // Admin uses useChat(candidateId, 'candidate')
            // Candidate uses useChat(adminId, 'admin')

            // I need to know MY role definitively.
            // Let's decode token.
            const t = getToken()
            if (!t) return
            const d: any = require("jwt-decode").jwtDecode(t)

            if (d.type === 'candidate') {
                candidateIdForApi = d.sub
            } else {
                candidateIdForApi = targetId
            }

            try {
                const res = await api.get(`/chat/messages/${candidateIdForApi}`)
                setMessages(res.data)
            } catch (err) {
                console.error("Failed to load chat history", err)
            }
        }

        fetchHistory()

        // 3. Connect Socket
        // We mount socket at /ws (from main.py `app.mount("/ws", ...)`), but socket.io client usually connects to root with path /ws/socket.io?
        // FastAPI python-socketio default: mounts at /socket.io automatically if wrapped in ASGIApp without specific path?
        // In main.py: `app.mount("/ws", socketio.ASGIApp(sio))`
        // This means the path is `/ws/socket.io`.

        const socket = io("http://localhost:8000", {
            path: "/ws/socket.io",
            auth: { access_token: token },
            transports: ["websocket", "polling"]
        })

        socket.on("connect", () => {
            setIsConnected(true)
            console.log("Socket connected")
        })

        socket.on("disconnect", () => {
            setIsConnected(false)
            console.log("Socket disconnected")
        })

        socket.on("new_message", (msg: ChatMessage) => {
            // Check if message belongs to this conversation
            // If I am admin, msg should be from targetId (candidate) OR from ME to targetId.
            // If I am candidate, msg should be from admin OR from ME to admin.

            // Ideally backend sends to rooms. `candidate_{id}` or `admin_{id}`.
            // And I joined the relevant room.
            // So if I receive it, it's for me.
            // BUT, if admin is chatting with Candidate A, and Candidate B sends msg, Admin receives it.
            // Admin should only show it if the current active chat is Candidate B.
            // So filtering is needed.

            // logic:
            // if (msg.sender_type === 'candidate' && msg.sender_id === targetId) -> incoming from candidate I'm viewing
            // if (msg.sender_type === 'admin' && msg.sender_id === currentUser.id && targetType === 'candidate') -> outgoing from me (if verified via socket echo, but usually we optimistically add or receive echo)

            // Let's just append for now and handle filtering in UI or assume room isolation is good.
            // Wait, Admin receives ALL notifications?
            // Backend: `await sio.emit("new_message", ..., room=room)`
            // Room is `admin_{receiver_id}` or `candidate_{receiver_id}`.

            // If Candidate sends to Admin:
            // receiver_id is Admin ID (Wait? Backend says `receiver_id` param in send_message).
            // Backend `send_message`: "For candidate->admin, receiver_id is admin id."
            // Room logic: `room = f"admin_{receiver_id}"` -> `admin_1`?
            // Admin joins `admin_{user_id}`.
            // So if Candidate sends to Admin ID 1, Admin 1 gets it.

            // So if Admin 1 is chatting with Candidate 5, and Candidate 6 sends msg.
            // Admin 1 receives msg from Candidate 6.
            // Admin 1's UI for Candidate 5 should NOT show msg from Candidate 6.

            // So we must filter:
            // Update: useChat is specific to a targetId.

            // If I am Admin: I want messages where (sender='candidate' AND sender_id=targetId) OR (sender='admin' AND receiver_id=targetId).
            // If I am Candidate: I want messages where (sender='admin' AND sender_id=targetId) OR (sender='candidate' AND receiver_id=targetId)  <-- wait, receiver_id is admin?

            // Let's simplify:
            // Just append if relevant.
            const isRelevant =
                (msg.sender_type === targetType && msg.sender_id === targetId) || // Incoming from target
                (msg.sender_type !== targetType && (  // Outgoing from me?
                    // If I am admin, outgoing is sender=admin.
                    // How do I know the receiver of this message?
                    // The msg event payload in backend only has sender info and message. `{"sender_id": ..., "sender_type": ..., "message": ...}`
                    // It does NOT have receiver_id!
                    // This is a flaw in my backend `emit`.
                    // However, if I sent it via API, I add it to state manually.
                    // So I should ignore my own "echo" if it comes back, or use it to confirm?
                    // Since backend emits to ROOM, and I am in the room...
                    // If I am Admin 1, I am in `admin_1`.
                    // Candidate sends to Admin 1. Backend emits to `admin_1`.
                    // Admin 1 (me) receives it.
                    // Msg says: sender_id=CandidateId, type=candidate.
                    // If CandidateId == targetId, then it's for this chat window.
                    msg.sender_id === targetId // Simplified check
                ))

            // Wait, what if I (Admin) send message to Candidate on another device?
            // Backend emits to `candidate_{id}` room.
            // Admin is NOT in `candidate_{id}` room. Admin is in `admin_{id}`.
            // so Admin won't receive their own message via socket unless they join candidate room?
            // Or backend emits to sender too? Backend doesn't emit to sender room currently.

            // Conclusion: I will manually append my sent messages.
            // And for incoming, I will only append if sender_id === targetId.

            if (msg.sender_type === targetType && msg.sender_id === targetId) {
                setMessages(prev => [...prev, msg])
            }
        })

        socketRef.current = socket

        return () => {
            socket.disconnect()
        }
    }, [targetId, targetType])

    const sendMessage = async (text: string) => {
        try {
            // Optimistic update
            const tempMsg: ChatMessage = {
                sender_id: currentUser?.id || 0,
                sender_type: currentUser?.type as any || "admin",
                message: text,
                created_at: new Date().toISOString()
            }
            setMessages(prev => [...prev, tempMsg]) // Add immediately

            await api.post("/chat/send", null, {
                params: {
                    receiver_id: targetId,
                    message: text
                }
            })
        } catch (error) {
            toast.error("Failed to send message")
            // Remove failed message? (TODO)
        }
    }

    return { messages, sendMessage, isConnected }
}
