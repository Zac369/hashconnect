import React from "react";
import { useHashConnect } from "../../HashConnectAPIProvider"

const Login = () => {
  const { authenticate, connect, walletData, netWork, installedExtensions } = useHashConnect();
  const { accountIds, id } = walletData;

  const conCatAccounts = (lastAccs: string, Acc: string) => {
    return lastAccs + " " + Acc;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(walletData.pairingString);
  };

  const handleClick = () => {
    if (installedExtensions) connect();
    else
      alert(
        "Please install hashconnect wallet extension first. from chrome web store."
      );
  };

  const handleAuth = () => {
    if (accountIds) {
      authenticate(accountIds[0]);
    } else {
      alert("Please connect to wallet first.");
    }
  }

  return (
      <div className="grid place-items-center">
          <button className="text-2xl flex my-5 bg-gray-500 rounded-md p-2 hover:text-white" onClick={handleClick}>Login With HashPack</button>
          <button className="text-2xl flex my-5 bg-gray-500 rounded-md p-2 hover:text-white" onClick={handleAuth}>Authenticate</button>

          {accountIds && accountIds?.length > 0 && (
          <div>
            <h3>Connected Accounts Details:</h3>
            <p>Network: {netWork}</p>
            <p>Accounts: [{accountIds.reduce(conCatAccounts)}]</p>
          </div>
        )}

        {!installedExtensions && <p>Wallet is not installed in your browser</p>}

        <p>Paring key : {walletData.pairingString.substring(0, 15)}...</p>

        <p>
          <button onClick={handleCopy}>Copy Paring String</button>
        </p>
      </div>
  )
}

export default Login