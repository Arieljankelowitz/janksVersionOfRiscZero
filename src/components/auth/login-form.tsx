import React from "react"
import { useState } from "react"
import axios from "axios"
import { MessageDisplay } from "../ui/message-display"

interface LoginFormProps {
    onLoginSuccess: (token: string, username: string, publicKey: string) => void
    switchToRegister: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, switchToRegister }) => {
    const [username, setUsername] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [message, setMessage] = useState<string>("")
    const [messageType, setMessageType] = useState<"info" | "success" | "error">("info")

    // Display a message with type and auto-clear
    const displayMessage = (text: string, type: "info" | "success" | "error" = "info") => {
        setMessage(text)
        setMessageType(type)
        setTimeout(() => {
            setMessage("")
        }, 5000) // Clear message after 5 seconds
    }

    // Handle login
    const handleLogin = async () => {
        if (!username || !password) {
            displayMessage("Please enter your username and password", "error")
            return
        }

        setIsLoading(true)
        try {
            const response = await axios.post("http://127.0.0.1:5000/api/login", {
                username,
                password,
            })

            // Handle successful login
            const token = response.data.token

            // Extract public key from receipt
            let publicKey = ""
            if (response.data.receipt?.cert?.client_public_key) {
                publicKey = response.data.receipt.cert.client_public_key
            }

            displayMessage("Login successful", "success")
            onLoginSuccess(token, username, publicKey)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                displayMessage(error.response?.data?.error || "Login failed", "error")
            } else {
                displayMessage("An unknown error occurred", "error")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Login</h2>
                <p className="text-gray-600 text-center">Sign in to access your account</p>
            </div>

            {message && <MessageDisplay message={message} type={messageType} />}

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                    Username
                </label>
                <input
                    id="username"
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>

            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="******************"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <div className="flex items-center justify-between mb-6">
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    onClick={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? "Signing in..." : "Sign In"}
                </button>
            </div>

            <div className="text-center">
                <p className="text-sm">
                    Don't have an account?{" "}
                    <button className="text-blue-500 hover:text-blue-800" onClick={switchToRegister}>
                        Register
                    </button>
                </p>
            </div>
        </div>
    )
}

