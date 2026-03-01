"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, MessageSquare, Download, RefreshCw } from "lucide-react"
import { ChatPanel } from "@/components/ChatPanel"
import toast from "react-hot-toast"
import { getToken } from "@/lib/auth"

interface Candidate {
    id: number
    name: string
    email: string
    resume_uploaded: boolean
    skills_uploaded: boolean
    system_check_completed: boolean
    notice_period_uploaded: boolean
}

export default function AdminDashboard() {
    const router = useRouter()
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedChat, setSelectedChat] = useState<{ id: number; name: string } | null>(null)

    // Decoding token to get my admin ID?
    // ChatPanel needs currentUserId. admin users are in admin table.
    // The token payload has "sub" as user_id.
    const [adminId, setAdminId] = useState<number>(0)

    useEffect(() => {
        const token = getToken()
        if (token) {
            try {
                const jwt = require("jwt-decode")
                const decoded: any = jwt.jwtDecode(token)
                setAdminId(decoded.sub)
            } catch (e) { }
        }
        fetchCandidates()
    }, [])

    const fetchCandidates = async () => {
        try {
            const res = await api.get("/admin/candidates")
            setCandidates(res.data)
        } catch (error) {
            toast.error("Failed to fetch candidates")
        } finally {
            setLoading(false)
        }
    }

    const StatusIcon = ({ completed }: { completed: boolean }) => {
        return completed ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
            <XCircle className="h-5 w-5 text-gray-300" />
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-card p-6 rounded-xl shadow-sm border">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={fetchCandidates}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/")}>Logout</Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Candidates Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Resume</th>
                                    <th className="px-4 py-3">Skills</th>
                                    <th className="px-4 py-3">Sys Check</th>
                                    <th className="px-4 py-3">Notice</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.map((c) => (
                                    <tr key={c.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-medium">
                                            <div>{c.name}</div>
                                            <div className="text-xs text-muted-foreground">{c.email}</div>
                                        </td>
                                        <td className="px-4 py-3"><StatusIcon completed={c.resume_uploaded} /></td>
                                        <td className="px-4 py-3"><StatusIcon completed={c.skills_uploaded} /></td>
                                        <td className="px-4 py-3"><StatusIcon completed={c.system_check_completed} /></td>
                                        <td className="px-4 py-3"><StatusIcon completed={c.notice_period_uploaded} /></td>
                                        <td className="px-4 py-3">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setSelectedChat({ id: c.id, name: c.name })}
                                            >
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Chat
                                            </Button>
                                            {/* Add download/view functionality if needed */}
                                        </td>
                                    </tr>
                                ))}
                                {candidates.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-6 text-muted-foreground">No candidates found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {selectedChat && (
                <ChatPanel
                    targetId={selectedChat.id}
                    targetType="candidate"
                    title={`Chat with ${selectedChat.name}`}
                    isOpen={!!selectedChat}
                    onClose={() => setSelectedChat(null)}
                    currentUserId={adminId}
                />
            )}
        </div>
    )
}
