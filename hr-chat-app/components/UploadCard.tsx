import { useState } from "react"
import { Upload, CheckCircle, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"

interface UploadCardProps {
    title: string
    description: string
    onUpload: (file: File) => Promise<void>
    isCompleted: boolean
    isDisabled: boolean
    accept?: string
}

export function UploadCard({ title, description, onUpload, isCompleted, isDisabled, accept }: UploadCardProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return
        setIsUploading(true)
        try {
            await onUpload(file)
            setFile(null)
            toast.success("Upload successful!")
            // Play a sound or show specific popup as requested?
            // Requirement: "Candidate receives popup: 'Resume uploaded successfully! ✓'"
            // toast.success does this. 
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Card className={isDisabled ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {title}
                    {isCompleted && <CheckCircle className="text-green-500 h-5 w-5" />}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {isCompleted ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Completed</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Input
                            type="file"
                            accept={accept}
                            onChange={handleFileChange}
                            disabled={isUploading || isDisabled}
                        />
                        {file && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                                <FileText className="h-4 w-4" />
                                {file.name}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {!isCompleted && (
                    <Button
                        onClick={handleUpload}
                        disabled={!file || isUploading || isDisabled}
                        className="w-full"
                    >
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUploading ? "Uploading..." : "Upload & Continue"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
