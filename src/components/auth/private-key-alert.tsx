import React from "react"

interface PrivateKeyAlertProps {
    privateKey: string
    onCopy: () => void
    onClose: () => void
}

export const PrivateKeyAlert: React.FC<PrivateKeyAlertProps> = ({ privateKey, onCopy, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                <h3 className="text-xl font-bold text-red-600 mb-4">IMPORTANT: Save Your Private Key</h3>
                <p className="mb-4 text-gray-700">
                    This is your private key. It will be shown ONLY ONCE. Save it in a secure location. You will need this key to
                    sign transactions.
                </p>
                <div className="bg-gray-100 p-3 rounded-md mb-4 overflow-x-auto">
                    <code className="text-sm text-gray-800 break-all">{privateKey}</code>
                </div>
                <div className="flex justify-between">
                    <button onClick={onCopy} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Copy to Clipboard
                    </button>
                    <button onClick={onClose} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        I've Saved It
                    </button>
                </div>
            </div>
        </div>
    )
}

