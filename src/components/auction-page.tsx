import React, { useState, useEffect } from "react";
import axios from "axios";
import AuctionItemsPage from "./auction-items-page";

interface Receipt {
  cert: {
    balance: number;
    date: string;
    client_public_key: string;
  };
  bank_sig: string;
  bank_public_key: string;
}

const AuctionPage: React.FC = () => {
  // State variables
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [balance, setBalance] = useState<string>("100");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [privateKey, setPrivateKey] = useState<string>("");
  const [userPublicKey, setUserPublicKey] = useState<string>("");
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string>("");
  const [activeView, setActiveView] = useState<string>("login"); // "login", "register", "auction", "profile"

  // Check for existing session on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedUsername = localStorage.getItem("username");
    const savedPublicKey = localStorage.getItem("userPublicKey");
    
    if (savedToken && savedUsername) {
      setAuthToken(savedToken);
      setUsername(savedUsername);
      if (savedPublicKey) {
        setUserPublicKey(savedPublicKey);
      }
      setIsLoggedIn(true);
      setActiveView("auction"); // Go directly to auction page
    }
  }, []);

  // Display a message with type and auto-clear
  const displayMessage = (text: string, type: "info" | "success" | "error" = "info") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
    }, 5000); // Clear message after 5 seconds
  };

  // Handle registration
  const handleSignup = async () => {
    if (!username || !password || !balance) {
      displayMessage("Please fill in all fields", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/signup", {
        username,
        password,
        initial_balance: parseFloat(balance),
      });
      
      // Handle successful signup
      displayMessage("Account created successfully! Save your private key.", "success");
      
      // Store the private key and token
      if (response.data.private_key) {
        setPrivateKey(response.data.private_key);
        setShowPrivateKey(true);
      }
      
      // Extract public key from receipt
      if (response.data.receipt?.cert?.client_public_key) {
        const publicKey = response.data.receipt.cert.client_public_key;
        setUserPublicKey(publicKey);
        localStorage.setItem("userPublicKey", publicKey);
      }
      
      // Handle login after signup
      if (response.data.token) {
        setAuthToken(response.data.token);
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("username", username);
        setIsLoggedIn(true);
        fetchReceipts(response.data.token);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        displayMessage(error.response?.data?.error || "Registration failed", "error");
      } else {
        displayMessage("An unknown error occurred", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!username || !password) {
      displayMessage("Please enter your username and password", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/login", {
        username,
        password,
      });
      
      // Handle successful login
      const token = response.data.token;
      setAuthToken(token);
      localStorage.setItem("authToken", token);
      localStorage.setItem("username", username);
      
      // Extract public key from receipt
      if (response.data.receipt?.cert?.client_public_key) {
        const publicKey = response.data.receipt.cert.client_public_key;
        setUserPublicKey(publicKey);
        localStorage.setItem("userPublicKey", publicKey);
      }
      
      setIsLoggedIn(true);
      displayMessage("Login successful", "success");
      fetchReceipts(token);
      setActiveView("auction"); // Navigate to auction page after login
    } catch (error) {
      if (axios.isAxiosError(error)) {
        displayMessage(error.response?.data?.error || "Login failed", "error");
      } else {
        displayMessage("An unknown error occurred", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch receipts
  const fetchReceipts = async (token = authToken) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/receipts", {
        headers: { Authorization: token },
      });
      setReceipts(response.data.receipts || []);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired or invalid, logout
        handleLogout();
        displayMessage("Session expired. Please log in again.", "error");
      } else {
        displayMessage("Failed to fetch receipts", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken("");
    setReceipts([]);
    setActiveView("login");
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    displayMessage("Logged out successfully", "info");
  };

  // Copy private key to clipboard
  const copyPrivateKey = () => {
    navigator.clipboard.writeText(privateKey);
    displayMessage("Private key copied to clipboard", "success");
  };

  // Format JSON for display
  const formatJson = (json: any): string => {
    try {
      if (typeof json === 'string') {
        return JSON.stringify(JSON.parse(json), null, 2);
      }
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json);
    }
  };

  // Navigate between pages
  const navigateTo = (page: string) => {
    setActiveView(page);
  };

  // Render login/register view
  const renderAuthView = () => (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          {activeView === "login" ? "Login" : "Create Account"}
        </h2>
        <p className="text-gray-600 text-center">
          {activeView === "login" 
            ? "Sign in to access your account" 
            : "Register to participate in anonymous auctions"}
        </p>
      </div>

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

      {activeView === "register" && (
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
      )}

      <div className="flex items-center justify-between mb-6">
        {activeView === "login" ? (
          <>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </>
        ) : (
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            onClick={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        )}
      </div>

      <div className="text-center">
        {activeView === "login" ? (
          <p className="text-sm">
            Don't have an account?{" "}
            <button
              className="text-blue-500 hover:text-blue-800"
              onClick={() => setActiveView("register")}
            >
              Register
            </button>
          </p>
        ) : (
          <p className="text-sm">
            Already have an account?{" "}
            <button
              className="text-blue-500 hover:text-blue-800"
              onClick={() => setActiveView("login")}
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );

  // Render private key alert after registration
  const renderPrivateKeyAlert = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h3 className="text-xl font-bold text-red-600 mb-4">IMPORTANT: Save Your Private Key</h3>
        <p className="mb-4 text-gray-700">
          This is your private key. It will be shown ONLY ONCE. Save it in a secure location.
          You will need this key to sign transactions.
        </p>
        <div className="bg-gray-100 p-3 rounded-md mb-4 overflow-x-auto">
          <code className="text-sm text-gray-800 break-all">
            {privateKey}
          </code>
        </div>
        <div className="flex justify-between">
          <button
            onClick={copyPrivateKey}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Copy to Clipboard
          </button>
          <button
            onClick={() => {
              setShowPrivateKey(false);
              setActiveView("auction"); // Go to auction page after acknowledging private key
            }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            I've Saved It
          </button>
        </div>
      </div>
    </div>
  );

  // Render profile/dashboard view
  const renderProfileView = () => (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">User Profile & Receipts</h1>
          <div>
            <button
              onClick={() => navigateTo("auction")}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm mr-2"
            >
              Back to Auctions
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-600 text-sm">Username</p>
              <p className="font-medium">{username}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Public Key</p>
              <p className="font-mono text-xs truncate">{userPublicKey}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Your Receipts</h2>
          {receipts.length > 0 ? (
            <div className="space-y-4">
              {receipts.map((receipt, index) => (
                <div key={index} className="border rounded-md p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-700 mb-2">Receipt #{index + 1}</h3>
                  <pre className="bg-white p-3 rounded text-xs overflow-x-auto border">
                    {formatJson(receipt)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No receipts available.</p>
          )}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => fetchReceipts()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh Receipts"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">Anonymous Auction System</h1>
        <p className="text-center text-gray-600 mt-2">
          A secure platform for anonymous bidding
        </p>
      </header>

      {/* Show message if exists */}
      {message && (
        <div 
          className={`max-w-md mx-auto mb-6 p-3 rounded-md ${
            messageType === "error" 
              ? "bg-red-100 text-red-700" 
              : messageType === "success" 
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
          }`}
        >
          {message}
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
        renderProfileView()
      ) : null}

      {/* Private Key Modal */}
      {showPrivateKey && renderPrivateKeyAlert()}
    </div>
  );
};

export default AuctionPage;