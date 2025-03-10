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

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [showKeyModal, setShowKeyModal] = useState(false)
    const [privateKey, setPrivateKey] = useState("")
    const [copied, setCopied] = useState(false)

    const toggleView = () => {
        setIsLogin(!isLogin)
    }

    const generatePrivateKey = () => {
        // This is just a mock private key for demonstration
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        let result = ""
        for (let i = 0; i < 64; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length))
        }
        return result
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!isLogin) {
            // For registration, generate a private key and show the modal
            const newKey = generatePrivateKey()
            setPrivateKey(newKey)
            setShowKeyModal(true)
        } else {
            // For login, you would typically handle authentication here
            console.log("Login submitted")
            // Redirect or handle login success
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

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">{isLogin ? "Login" : "Register"}</CardTitle>
                    <CardDescription className="text-center">
                        {isLogin ? "Enter your credentials to access your account" : "Create a new account"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" placeholder={isLogin ? "Enter your username" : "Choose a username"} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" placeholder="••••••••" required />
                        </div>

                        {!isLogin && (
                            <div className="space-y-2">
                                <Label htmlFor="balance">Initial Balance</Label>
                                <Input id="balance" type="number" placeholder="0.00" required />
                            </div>
                        )}

                        <Button type="submit" className="w-full">
                            {isLogin ? "Login" : "Register"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <Button variant="link" className="p-0 h-auto font-medium text-primary" onClick={toggleView}>
                            {isLogin ? "Register" : "Login"}
                        </Button>
                    </p>
                </CardFooter>
            </Card>

            <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Your Private Key</DialogTitle>
                        <DialogDescription>
                            Please save this private key somewhere safe. You will not be able to recover it if lost.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="privateKey" className="sr-only">
                                Private Key
                            </Label>
                            <div className="bg-muted p-3 rounded-md overflow-x-auto">
                                <code className="text-sm font-mono">{privateKey}</code>
                            </div>
                        </div>
                        <Button type="button" size="icon" onClick={copyToClipboard}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={() => setShowKeyModal(false)} className="w-full">
                            I've Saved My Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

