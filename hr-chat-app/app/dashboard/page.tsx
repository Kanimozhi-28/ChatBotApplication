"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Stepper } from "@/components/Stepper"
import { UploadCard } from "@/components/UploadCard"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Monitor } from "lucide-react"
import api from "@/lib/api"
import toast from "react-hot-toast"
import { ChatPanel } from "@/components/ChatPanel"
import { jwtDecode } from "jwt-decode"

interface CandidateStatus {
    resume_uploaded: boolean
    skills_uploaded: boolean
    system_check_completed: boolean
    notice_period_uploaded: boolean
}

export default function DashboardPage() {
    const router = useRouter()
    const [status, setStatus] = useState<CandidateStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [candidateId, setCandidateId] = useState(0)

    const fetchStatus = async () => {
        try {
            const res = await api.get("/candidate/status")
            setStatus(res.data)
        } catch (error: any) {
            console.error("Fetch status error:", error)
            const detail = error.response?.data?.detail || "Failed to fetch status"
            toast.error(detail)
            // If 401, maybe redirect? For now just log.
            if (error.response?.status === 401) {
                localStorage.removeItem("hr_chat_token")
                router.push("/login")
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
        const token = typeof window !== "undefined" ? localStorage.getItem("hr_chat_token") : null;
        if (token) {
            try {
                const decoded: any = jwtDecode(token)
                setCandidateId(decoded.sub)
            } catch (e) { }
        }
    }, [])

    if (loading || !status) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    const steps = [
        { label: "Resume Upload", completed: status.resume_uploaded, active: !status.resume_uploaded },
        { label: "Skills Summary", completed: status.skills_uploaded, active: status.resume_uploaded && !status.skills_uploaded },
        { label: "System Check", completed: status.system_check_completed, active: status.skills_uploaded && !status.system_check_completed },
        { label: "Notice Period", completed: status.notice_period_uploaded, active: status.system_check_completed && !status.notice_period_uploaded },
    ]

    const handleResumeUpload = async (file: File) => {
        const formData = new FormData()
        formData.append("file", file)
        await api.post("/candidate/upload/resume", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        })
        fetchStatus()
    }

    const handleSkillsUpload = async (file: File) => {
        const formData = new FormData()
        formData.append("file", file)
        await api.post("/candidate/upload/skills", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        })
        fetchStatus()
    }

    const handleSystemCheck = async () => {
        await api.post("/candidate/system-check")
        toast.success("System check completed!")
        fetchStatus()
    }

    const handleNoticeUpload = async (file: File) => {
        const formData = new FormData()
        formData.append("file", file)
        await api.post("/candidate/upload/notice-period", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        })
        fetchStatus()
    }

    // Calculate current step index (0-3) or 4 if all done
    const currentStepIndex = steps.findIndex(s => s.active)
    const isAllDone = currentStepIndex === -1 && status.notice_period_uploaded

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center bg-white dark:bg-card p-6 rounded-xl shadow-sm border">
                    <h1 className="text-2xl font-bold">Candidate Portal</h1>
                    <Button variant="outline" onClick={() => router.push("/")}>Logout</Button>
                </div>

                <Stepper steps={steps} />

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Step 1: Resume */}
                    <UploadCard
                        title="1. Resume Upload"
                        description="Upload your latest resume (PDF/DOCX)."
                        onUpload={handleResumeUpload}
                        isCompleted={status.resume_uploaded}
                        isDisabled={false} // Always active effectively, or disable if done? Usually disable if subsequent steps started? No, user might want to re-upload. Requirements didn't specify re-upload blocking. But typical flow blocks forward only.
                        accept=".pdf,.docx,.doc"
                    />

                    {/* Step 2: Skills */}
                    <UploadCard
                        title="2. Skills Summary"
                        description="Upload a document summarizing your key technical skills."
                        onUpload={handleSkillsUpload}
                        isCompleted={status.skills_uploaded}
                        isDisabled={!status.resume_uploaded}
                        accept=".pdf,.docx,.doc"
                    />

                    {/* Step 3: System Check */}
                    <Card className={!status.skills_uploaded ? "opacity-50 pointer-events-none" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                3. System Check
                                {status.system_check_completed && <CheckCircle className="text-green-500 h-5 w-5" />}
                            </CardTitle>
                            <CardDescription>Verify your system meets the requirements for the interview.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {status.system_check_completed ? (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">Check Completed</span>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Click the button below to run an automated system check.</p>
                            )}
                        </CardContent>
                        <CardFooter>
                            {!status.system_check_completed && (
                                <Button onClick={handleSystemCheck} className="w-full">Run System Check</Button>
                            )}
                        </CardFooter>
                    </Card>

                    {/* Step 4: Notice Period */}
                    <UploadCard
                        title="4. Notice Period Doc"
                        description="Upload proof of notice period or availability."
                        onUpload={handleNoticeUpload}
                        isCompleted={status.notice_period_uploaded}
                        isDisabled={!status.system_check_completed}
                        accept=".pdf,.docx,.doc"
                    />
                </div>

                {isAllDone && (
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-6 rounded-xl text-center border border-green-200 dark:border-green-900">
                        <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
                        <p>You have completed all the required steps. We will review your profile and contact you soon.</p>
                    </div>
                )}
            </div>


            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    size="lg"
                    className="rounded-full shadow-lg h-14 w-14 p-0"
                    onClick={() => setIsChatOpen(!isChatOpen)}
                >
                    {isChatOpen ? (
                        <span className="text-xl font-bold">X</span>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                    )}
                </Button>
            </div>

            <ChatPanel
                targetId={1} // Assuming Admin ID is 1
                targetType="admin"
                title="Chat with Admin"
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                currentUserId={candidateId}
            />
        </div>
    )
}
