import './App.css';
import { useState } from 'react';
import AuctionPage from './components/auction-page';
import AuthPage from './components/auth-page';
``
function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState("")

  return (
    <div className="app-container">
      {loggedIn ?
        <AuctionPage username={username} setLoggedIn={setLoggedIn} />
        : <AuthPage setLoggedIn={setLoggedIn} setUsername={setUsername} />}
    </div>
  );
}

export default App;