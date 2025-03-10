import axios from "axios"

const bankServerUrl = "http://127.0.0.1:5000/api"


const hashPassword = async (password: string): Promise<string> => {
  // TODO hash the password
  const hashedPassword = password 
  return hashedPassword;
};

export const signup = (username: string, password: string, balance: string) => {
  // TODO finish this function (hit the signup endpoint on the bank server)
  try {
    const hashedPassword = hashPassword(password)
  
    const response = axios.post(`${bankServerUrl}/signup`)
    const privateKey = " " // change to response.data.privateKey
    return { username, privateKey }
  } catch (error) {
    return null
  }

}