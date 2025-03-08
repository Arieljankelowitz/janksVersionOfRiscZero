import './App.css';
import { useState } from 'react';
import AuctionPage from './components/auction-page';
import ConnectionTest from './components/connection-test';

function App() {
  return (
    <div className="app-container">
      {/* <AuctionPage /> */}
      <ConnectionTest />
    </div>
  );
}

export default App;