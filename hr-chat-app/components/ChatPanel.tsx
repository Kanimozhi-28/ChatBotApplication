import { useRef, useEffect, useState } from "react"
import { Send, X, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChat } from "@/hooks/useChat"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
    targetId: number
    targetType: "admin" | "candidate"
    title: string
    isOpen: boolean
    onClose: () => void
    currentUserId: number // Used to determine alignment
}

export function ChatPanel({ targetId, targetType, title, isOpen, onClose, currentUserId }: ChatPanelProps) {
    const { messages, sendMessage, isConnected } = useChat(targetId, targetType)
    const [inputText, setInputText] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    const handleSend = () => {
        if (!inputText.trim()) return
        sendMessage(inputText)
        setInputText("")
    }

    if (!isOpen) return null

    return (
        <Card className="fixed bottom-4 right-4 w-80 h-96 shadow-xl flex flex-col z-50">
            <CardHeader className="p-3 border-b flex flex-row items-center justify-between bg-primary text-primary-foreground rounded-t-lg">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {title}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary/80" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-3" ref={scrollRef}>
                {!isConnected && <p className="text-xs text-center text-muted-foreground">Connecting...</p>}
                {messages.map((msg, idx) => {
                    // Align right if me, left if them
                    // "me" check: msg.sender_id === currentUserId && msg.sender_type !== targetType (assuming I am opposite type)
                    // Simplified: if current user is 'admin', my messages are type 'admin'.
                    // My ID is currentUserId.
                    // Is msg from me? 
                    // If I am Admin, my type is 'admin'.
                    // If msg.sender_type == 'admin' -> it's me (assuming single admin account or handled).
                    // Better: pass `myType` prop? or just guess.
                    // Let's assume passed `targetType` implies `myType` is opposite.
                    const isMe = msg.sender_type !== targetType

                    return (
                        <div key={idx} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                    isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                )}
                            >
                                {msg.message}
                            </div>
                        </div>
                    )
                })}
            </CardContent>
            <div className="p-3 border-t flex gap-2">
                <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="text-sm"
                />
                <Button size="icon" onClick={handleSend}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </Card>
    )
}

