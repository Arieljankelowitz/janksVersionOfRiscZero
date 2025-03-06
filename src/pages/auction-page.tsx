import React from "react"
import { useState, useEffect } from "react"
import { LoginForm } from "../components/auth/login-form"
import { RegisterForm } from "../components/auth/register-form"
import { PrivateKeyAlert } from "../components/auth/private-key-alert"
import { ProfileView } from "../components/profile/profile-view"
import { MessageDisplay } from "../components/ui/message-display"
import AuctionItemsPage from "./auction-items-page"

const AuctionPage: React.FC = () => {
    // State variables
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
    const [username, setUsername] = useState<string>("")
    const [privateKey, setPrivateKey] = useState<string>("")
    const [userPublicKey, setUserPublicKey] = useState<string>("")
    const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false)
    const [message, setMessage] = useState<string>("")
    const [messageType, setMessageType] = useState<"info" | "success" | "error">("info")
    const [authToken, setAuthToken] = useState<string>("")
    const [activeView, setActiveView] = useState<string>("login") // "login", "register", "auction", "profile"

    // Check for existing session on component mount
    useEffect(() => {
        const savedToken = localStorage.getItem("authToken")
        const savedUsername = localStorage.getItem("username")
        const savedPublicKey = localStorage.getItem("userPublicKey")

        if (savedToken && savedUsername) {
            setAuthToken(savedToken)
            setUsername(savedUsername)
            if (savedPublicKey) {
                setUserPublicKey(savedPublicKey)
            }
            setIsLoggedIn(true)
            setActiveView("auction") // Go directly to auction page
        }
    }, [])

    // Display a message with type and auto-clear
    const displayMessage = (text: string, type: "info" | "success" | "error" = "info") => {
        setMessage(text)
        setMessageType(type)
        setTimeout(() => {
            setMessage("")
        }, 5000) // Clear message after 5 seconds
    }

    // Handle successful login
    const handleLoginSuccess = (token: string, username: string, publicKey: string) => {
        setAuthToken(token)
        setUsername(username)
        setUserPublicKey(publicKey)
        setIsLoggedIn(true)

        localStorage.setItem("authToken", token)
        localStorage.setItem("username", username)
        if (publicKey) {
            localStorage.setItem("userPublicKey", publicKey)
        }

        setActiveView("auction")
    }

    // Handle successful registration
    const handleRegisterSuccess = (token: string, username: string, privateKey: string, publicKey: string) => {
        setAuthToken(token)
        setUsername(username)
        setPrivateKey(privateKey)
        setUserPublicKey(publicKey)


        localStorage.setItem("authToken", token)
        localStorage.setItem("username", username)
        if (publicKey) {
            localStorage.setItem("userPublicKey", publicKey)
        }

        setIsLoggedIn(true)
        setActiveView("auction")
        setShowPrivateKey(true)
    }

    // Handle logout
    const handleLogout = () => {
        setIsLoggedIn(false)
        setAuthToken("")
        setActiveView("login")
        localStorage.removeItem("authToken")
        localStorage.removeItem("username")
        displayMessage("Logged out successfully", "info")
    }

    // Copy private key to clipboard
    const copyPrivateKey = () => {
        navigator.clipboard.writeText(privateKey)
        displayMessage("Private key copied to clipboard", "success")
    }

    // Navigate between pages
    const navigateTo = (page: string) => {
        setActiveView(page)
    }

    // Render auth view (login or register)
    const renderAuthView = () =>
        activeView === "login" ? (
            <LoginForm onLoginSuccess={handleLoginSuccess} switchToRegister={() => setActiveView("register")} />
        ) : (
            <RegisterForm onRegisterSuccess={handleRegisterSuccess} switchToLogin={() => setActiveView("login")} />
        )

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <header className="max-w-4xl mx-auto mb-8">
                <h1 className="text-3xl font-bold text-center text-gray-800">Anonymous Auction System</h1>
                <p className="text-center text-gray-600 mt-2">A secure platform for anonymous bidding</p>
            </header>

            {/* Show message if exists */}
            {message && (
                <div className="max-w-md mx-auto mb-6">
                    <MessageDisplay message={message} type={messageType} />
                </div>
            )}

            {/* Main Content - Show different views based on state */}
            {!isLoggedIn ? (
                renderAuthView()
            ) : activeView === "auction" ? (
                <AuctionItemsPage
                    username={username}
                    authToken={authToken}
                    onLogout={handleLogout}
                    userPublicKey={userPublicKey}
                    navigateTo={navigateTo}
                />
            ) : activeView === "profile" ? (
                <ProfileView
                    username={username}
                    userPublicKey={userPublicKey}
                    authToken={authToken}
                    onNavigateToAuction={() => navigateTo("auction")}
                    onLogout={handleLogout}
                />
            ) : null}

            {/* Private Key Modal */}
            {showPrivateKey && (
                <PrivateKeyAlert
                    privateKey={privateKey}
                    onCopy={copyPrivateKey}
                    onClose={() => {
                        setShowPrivateKey(false)
                        setActiveView("auction")
                    }}
                />
            )}
        </div>
    )
}

export default AuctionPage

