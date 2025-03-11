import './App.css';
import { SetStateAction, useState } from 'react';
import AuctionPage from './components/auction-page';
import ConnectionTest from './components/connection-test';
import AuthPage from './components/auth-page';
import AuctionDetail from './components/socket-test';

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState("")

  return (
    <div className="app-container">
      {/* {loggedIn ?
        <AuctionPage username={username} setLoggedIn={setLoggedIn} />
        : <AuthPage setLoggedIn={setLoggedIn} setUsername={setUsername} />} */}
      <AuctionPage username={username} setLoggedIn={setLoggedIn} />
      {/* <AuctionDetail auctionId={'1'} /> */}
      {/* <ConnectionTest /> */}
    </div>
  );
}

export default App;