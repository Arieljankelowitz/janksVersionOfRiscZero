import React from "react"
import { useState } from "react"
import axios from "axios"
import { MessageDisplay } from "../ui/message-display"

interface RegisterFormProps {
    onRegisterSuccess: (token: string, username: string, privateKey: string, publicKey: string) => void
    switchToLogin: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, switchToLogin }) => {
    const [username, setUsername] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [balance, setBalance] = useState<string>("100")
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

    // Handle registration
    const handleSignup = async () => {
        if (!username || !password || !balance) {
            displayMessage("Please fill in all fields", "error")
            return
        }

        setIsLoading(true)
        try {
            const response = await axios.post("http://127.0.0.1:5000/api/signup", {
                username,
                password,
                initial_balance: Number.parseFloat(balance),
            })

            // Handle successful signup
            displayMessage("Account created successfully! Save your private key.", "success")

            // Store the private key and token
            let privateKey = ""
            if (response.data.private_key) {
                privateKey = response.data.private_key
            }

            // Extract public key from receipt
            let publicKey = ""
            if (response.data.receipt?.cert?.client_public_key) {
                publicKey = response.data.receipt.cert.client_public_key
            }

            // Handle login after signup
            if (response.data.token) {
                onRegisterSuccess(response.data.token, username, privateKey, publicKey)
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                displayMessage(error.response?.data?.error || "Registration failed", "error")
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
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Create Account</h2>
                <p className="text-gray-600 text-center">Register to participate in anonymous auctions</p>
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

            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="balance">
                    Initial Balance
                </label>
                <input
                    id="balance"
                    type="number"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="100"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                />
            </div>

            <div className="flex items-center justify-between mb-6">
                <button
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    onClick={handleSignup}
                    disabled={isLoading}
                >
                    {isLoading ? "Creating Account..." : "Create Account"}
                </button>
            </div>

            <div className="text-center">
                <p className="text-sm">
                    Already have an account?{" "}
                    <button className="text-blue-500 hover:text-blue-800" onClick={switchToLogin}>
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    )
}

