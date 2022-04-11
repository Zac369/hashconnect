import React, { useEffect, useState } from "react";
import { useHashConnect } from "../../HashConnectAPIProvider"

const Login = () => {
  const { authenticate, connect, walletData, netWork, installedExtensions } = useHashConnect();
  const { accountIds, id } = walletData;


  interface State {
    response: string;
    post: string;
    responseToPost: string;
  }

  const INITIAL_STATE: State = {
    response: '',
    post: '',
    responseToPost: '',
  };

  const [state, setState] = useState<State>(INITIAL_STATE);

  useEffect(() => {
    const componentDidMount = () => {
      callApi()
        .then(res => setState(prevState => ({ ...prevState, response: res.express })))
        .catch(err => console.log(err));
    }
    componentDidMount();
  }, []);

  const callApi = async () => {
    const response = await fetch('/api/hello');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    
    return body;
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    const response = await fetch('/api/world', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: state.post }),
    });
    const body = await response.text();
    
    setState(prevState => ({ ...prevState, responseToPost: body }));
  };

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

        <p>{state.response}</p>
        <form onSubmit={handleSubmit}>
          <p>
            <strong>Post to Server:</strong>
          </p>
          <input
            type="text"
            value={state.post}
            onChange={e => setState( prevState => ({ ...prevState, post: e.target.value }))}
          />
          <button type="submit">Submit</button>
        </form>
        <p>{state.responseToPost}</p>
      </div>
  )
}

export default Login