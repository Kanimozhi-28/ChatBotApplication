"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api"
import { setToken } from "@/lib/auth"

export default function LoginPage() {
    const router = useRouter()
    const { register, handleSubmit, formState: { errors } } = useForm()
    const [isLoading, setIsLoading] = useState(false)

    const onSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            const response = await api.post("/auth/login", data)
            const { access_token } = response.data
            setToken(access_token)
            toast.success("Logged in successfully")

            // Determine redirect based on decoding token or just basic logic (admin vs candidate)
            // For now, I'll decode the token to check type or just try to fetch user info?
            // Simple way: check the response or decode. 
            // The backend returns { access_token, token_type }
            // I can add user_type to the response in backend or decode it here.
            // Let's decode it here since I installed jwt-decode.

            const jwt = require("jwt-decode")
            const decoded: any = jwt.jwtDecode(access_token) // jwt-decode named export issue? usually standard import works.

            if (decoded.type === "admin") {
                router.push("/admin")
            } else {
                router.push("/dashboard")
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Login failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">Login</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email and password to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                {...register("email", { required: "Email is required" })}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message as string}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register("password", { required: "Password is required" })}
                            />
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message as string}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-primary hover:underline">
                            Register
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
