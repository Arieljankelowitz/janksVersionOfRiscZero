import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Check, Copy } from "lucide-react"
import { login, signup } from "@/services/bank-services"

interface AuthPageProps {
    setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
}

const AuthPage: React.FC<AuthPageProps> = ({ setLoggedIn, setUsername }) => {
    const [isLogin, setIsLogin] = useState(true)
    const [showKeyModal, setShowKeyModal] = useState(false)
    const [privateKey, setPrivateKey] = useState("")
    const [copied, setCopied] = useState(false)
    const [password, setPassword] = useState("");
    const [balance, setBalance] = useState(""); // used only for registration
    const [user, setUser] = useState("")
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const toggleView = () => {
        setIsLogin(!isLogin)
        setError("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        try {
            if (!isLogin) {
                // For registration, generate a private key and show the modal
                const signupResponse = await signup(user, password, balance);

                // Ensure signupResponse contains the expected properties
                if (!signupResponse || !signupResponse.username || !signupResponse.privateKey) {
                    throw new Error("Registration failed. Please try again.");
                }

                setPrivateKey(signupResponse.privateKey);
                setUsername(signupResponse.username);
                setShowKeyModal(true);
            } else {
                // For login, handle authentication
                const username = await login(user, password);
                if (username) {
                    setUsername(username);
                    setLoggedIn(true);
                }
            }
        } catch (error) {
            // Handle the error with a cleaner message
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            
            // Parse error message to be more user-friendly
            let cleanError = errorMessage;
            if (errorMessage.includes("status code 401")) {
                cleanError = "Incorrect username or password";
            } else if (errorMessage.includes("status code 404")) {
                cleanError = "Account not found";
            } else if (errorMessage.includes("status code 409")) {
                cleanError = "Username already exists";
            } else if (errorMessage.includes("status code 500")) {
                cleanError = "Server error. Please try again later";
            } else if (errorMessage.includes("Network Error")) {
                cleanError = "Network error. Please check your connection";
            }
            
            setError(cleanError);
        } finally {
            setIsSubmitting(false);
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(privateKey)
        setCopied(true)

        // Reset the copied state after 2 seconds
        setTimeout(() => {
            setCopied(false)
        }, 2000)
    }

    const closeModal = () => {
        setShowKeyModal(false)
        setLoggedIn(true)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Anonymous Bidding</h1>
                    <p className="mt-2 text-sm text-gray-600">Secure auction platform with zkVM privacy</p>
                </div>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-xl font-medium">{isLogin ? "Sign in" : "Create account"}</CardTitle>
                        <CardDescription>
                            {isLogin ? "Access your bidding account" : "Join our anonymous auction platform"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-medium">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    value={user}
                                    onChange={(e) => setUser(e.target.value)}
                                    placeholder="Enter username"
                                    className="h-10"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-10"
                                    required
                                />
                            </div>

                            {!isLogin && (
                                <div className="space-y-2">
                                    <Label htmlFor="balance" className="text-sm font-medium">
                                        Initial Balance ($)
                                    </Label>
                                    <Input
                                        id="balance"
                                        type="number"
                                        value={balance}
                                        onChange={(e) => setBalance(e.target.value)}
                                        placeholder="0.00"
                                        className="h-10"
                                        required
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="rounded-md bg-red-50 p-3 text-sm border border-red-200">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-red-500">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        <span className="font-medium text-red-800">{error}</span>
                                    </div>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {isLogin ? "Signing in..." : "Creating account..."}
                                    </div>
                                ) : (
                                    isLogin ? "Sign in" : "Create account"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t bg-gray-50 p-4">
                        <Button 
                            variant="link" 
                            className="text-sm text-indigo-600 hover:text-indigo-800" 
                            onClick={toggleView}
                        >
                            {isLogin ? "Create a new account" : "Already have an account? Sign in"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Save Your Private Key</DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                            This key is essential for bidding and cannot be recovered if lost. Store it securely.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mb-4">
                        <div className="flex items-start space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-amber-600">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <div className="text-xs text-amber-800">
                                <p className="font-medium mb-1">Store this key in a secure location:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Use a password manager if possible</li>
                                    <li>Required for all bidding actions</li>
                                    <li>Cannot be recovered if lost</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="privateKey" className="sr-only">
                                Private Key
                            </Label>
                            <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                                <code className="text-sm font-mono text-gray-800">{privateKey}</code>
                            </div>
                        </div>
                        <Button 
                            type="button" 
                            size="icon" 
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700" 
                            onClick={copyToClipboard}
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button 
                            type="button" 
                            onClick={closeModal} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            I've Saved My Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AuthPage