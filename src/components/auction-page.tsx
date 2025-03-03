import React, { useState } from "react";
import axios from "axios";

export default function BankApp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [balance, setBalance] = useState("");
  const [token, setToken] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [message, setMessage] = useState("");

  const handleSignup = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/signup", {
        username,
        password,
        initial_balance: balance,
      });
      setMessage(response.data.message);
      setToken(response.data.token);
      fetchReceipts(response.data.token); // Fetch receipts after signup
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.error || "Signup failed");
      } else {
        setMessage("An unknown error occurred");
      }
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/login", {
        username,
        password,
      });
      setToken(response.data.token);
      setMessage("Login successful");
      fetchReceipts(response.data.token); // Fetch receipts after login
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.error || "Login failed");
      } else {
        setMessage("An unknown error occurred");
      }
    }
  };

  const fetchReceipts = async (authToken = token) => {
    if (!authToken) {
      setMessage("You must be logged in to view receipts.");
      return;
    }

    try {
      const response = await axios.get("http://127.0.0.1:5000/api/receipts", {
        headers: { Authorization: authToken },
      });
      setReceipts(response.data.receipts);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.error || "Failed to fetch receipts");
      } else {
        setMessage("An unknown error occurred");
      }
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h1 className="text-xl font-bold">Bank App</h1>
      <input
        type="text"
        placeholder="Username"
        className="border p-2 w-full"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 w-full"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="number"
        placeholder="Initial Balance (Sign-up)"
        className="border p-2 w-full"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
      />
      <button className="bg-blue-500 text-white p-2 rounded w-full" onClick={handleSignup}>
        Sign Up
      </button>
      <button className="bg-green-500 text-white p-2 rounded w-full" onClick={handleLogin}>
        Log In
      </button>
      {token && (
        <button className="bg-gray-500 text-white p-2 rounded w-full" onClick={() => fetchReceipts()}>
          View Receipts
        </button>
      )}
      {message && <p className="text-red-500">{message}</p>}
      <div>
        <h2 className="text-lg font-semibold">Receipts</h2>
        <ul>
          {receipts.length > 0 ? (
            receipts.map((r, index) => (
              <li key={index} className="border p-2 my-1">{JSON.stringify(r)}</li>
            ))
          ) : (
            <p className="text-gray-500">No receipts available.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
