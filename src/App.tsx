import './App.css';
import { SetStateAction, useState } from 'react';
import AuctionPage from './components/auction-page';
import ConnectionTest from './components/connection-test';
import AuthPage from './components/auth-page';

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState("")

  return (
    <div className="app-container">
      {loggedIn ?
        <AuctionPage username={username} />
        : <AuthPage setLoggedIn={setLoggedIn} setUsername={setUsername} />}

      {/* <ConnectionTest /> */}
    </div>
  );
}

export default App;