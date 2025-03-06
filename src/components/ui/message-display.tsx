import React from "react"

interface MessageDisplayProps {
    message: string
    type: "info" | "success" | "error"
    className?: string
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, type, className = "" }) => {
    const baseClasses = "p-4 rounded-md"
    const typeClasses =
        type === "error"
            ? "bg-red-100 text-red-700 border border-red-200"
            : type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-blue-100 text-blue-700 border border-blue-200"

    return <div className={`${baseClasses} ${typeClasses} ${className}`}>{message}</div>
}

