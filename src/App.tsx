import './App.css';
import { useState } from 'react';
import AuctionPage from './components/auction-page';
import ConnectionTest from './components/connection-test';
import AuthPage from './components/auth-page';

function App() {
  const [loggedIn, setLoggedIn] = useState(true)

  return (
    <div className="app-container">
      {loggedIn ?
        <AuctionPage username={''} />
        : <AuthPage />}

      {/* <ConnectionTest /> */}
    </div>
  );
}

export default App;