import React, { useState } from 'react';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import SupplyChainABI from '../artifacts/contracts/SupplyChain.sol/SupplyChain.json';

const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';

function App() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('add');
  const [productName, setProductName] = useState('');
  const [initialLoc, setInitialLoc] = useState('');
  const [productId, setProductId] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newStatus, setNewStatus] = useState(0);
  const [newOwner, setNewOwner] = useState('');

  const { data: history } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SupplyChainABI.abi,
    functionName: 'getProductHistory',
    args: [productId ? BigInt(productId) : 0n],
  });

  const { data: verifyData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SupplyChainABI.abi,
    functionName: 'verifyProduct',
    args: [productId ? BigInt(productId) : 0n],
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isMining } = useWaitForTransactionReceipt({ hash });

  const handleAddProduct = (e) => {
    e.preventDefault();
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SupplyChainABI.abi,
      functionName: 'addProduct',
      args: [productName, initialLoc],
    });
  };

  const handleUpdateStatus = (e) => {
    e.preventDefault();
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SupplyChainABI.abi,
      functionName: 'updateStatus',
      args: [BigInt(productId), newLoc, Number(newStatus)],
    });
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SupplyChainABI.abi,
      functionName: 'transferOwnership',
      args: [BigInt(productId), newOwner],
    });
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">ChainTrack 8 📦</div>
        <ConnectButton />
      </header>

      <main className="glass-panel">
        <h1>Logistic Chain Management</h1>
        <p className="description">End-to-end transparency and audit for your supply chain.</p>

        <div className="tab-buttons">
          <button onClick={() => setActiveTab('add')} className={activeTab === 'add' ? 'active' : ''}>Register Cargo</button>
          <button onClick={() => setActiveTab('track')} className={activeTab === 'track' ? 'active' : ''}>Search & History</button>
          <button onClick={() => setActiveTab('manage')} className={activeTab === 'manage' ? 'active' : ''}>Movement & Owner</button>
        </div>

        <div className="content-area">
          {activeTab === 'add' && (
            <div className="form-box">
              <h2>Add Product to Ledger</h2>
              <form onSubmit={handleAddProduct}>
                <input placeholder="Item Name (e.g. Batch #902)" value={productName} onChange={e => setProductName(e.target.value)} />
                <input placeholder="Origin Hub Location" value={initialLoc} onChange={e => setInitialLoc(e.target.value)} />
                <button type="submit" className="btn-primary">Create Blockchain Record</button>
              </form>
            </div>
          )}

          {activeTab === 'track' && (
            <div className="track-box">
              <h2>Product Audit Log</h2>
              <input placeholder="Cargo ID" value={productId} onChange={e => setProductId(e.target.value)} />
              
              {verifyData && verifyData[0] && (
                <div className="status-verify">
                  ✅ Verified: {verifyData[1]} | Status: {["Created", "In Transit", "Delivered", "Canceled"][verifyData[3]]}
                </div>
              )}

              <div className="history-timeline">
                {history && history.map((h, i) => (
                  <div key={i} className="history-item">
                    <div className="dot"></div>
                    <div className="h-content">
                      <p><strong>{h.location}</strong></p>
                      <p>Status: {["Created", "In Transit", "Delivered", "Canceled"][h.status]}</p>
                      <p className="meta">{new Date(Number(h.timestamp)*1000).toLocaleString()} | Operator: {h.updater.slice(0,12)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="manage-box">
              <h2>Shipment Controls</h2>
              <div className="grid">
                <form onSubmit={handleUpdateStatus} className="sub-form">
                  <h3>Record Location</h3>
                  <input placeholder="Cargo ID" value={productId} onChange={e => setProductId(e.target.value)} />
                  <input placeholder="Current Checkpoint" value={newLoc} onChange={e => setNewLoc(e.target.value)} />
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    <option value={1}>In-Transit</option>
                    <option value={2}>Delivered</option>
                    <option value={3}>Canceled</option>
                  </select>
                  <button type="submit" className="btn-secondary">Update Tracker</button>
                </form>

                <form onSubmit={handleTransfer} className="sub-form">
                  <h3>Handover (Owner Change)</h3>
                  <input placeholder="Cargo ID" value={productId} onChange={e => setProductId(e.target.value)} />
                  <input placeholder="Next Custodian Address" value={newOwner} onChange={e => setNewOwner(e.target.value)} />
                  <button type="submit" className="btn-primary">Transfer Possession</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {isMining && <div className="loading-overlay">Updating Ledger...</div>}
    </div>
  );
}

export default App;
