import axios from "axios"
import { hashPassword } from "./rust-services"

const bankServerUrl = "http://127.0.0.1:5000/api"

export const signup = async (username: string, password: string, balance: string) => {
  // TODO finish this function (hit the signup endpoint on the bank server)
  try {
    const hashedPassword = await hashPassword(password)
    const registerData = {
      username, 
      password: hashedPassword,
      balance
    }
    const response = await axios.post(`${bankServerUrl}/signup`, registerData, 
      {
      headers: {
          'Content-Type': 'application/json',
        }
      })
    
    const privateKey = response.data.private_key

    return { username, privateKey }
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message); // Re-throws the error with the same message
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export const login = async (username: string, password: string) => {
  try {
    const hashedPassword = await hashPassword(password)
    const loginData = {
      username, 
      password: hashedPassword,
    }

    const response = await axios.post(`${bankServerUrl}/login`, loginData, 
      {
      headers: {
          'Content-Type': 'application/json',
        }
      })
      
    return response.data.username
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message); // Re-throws the error with the same message
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}
