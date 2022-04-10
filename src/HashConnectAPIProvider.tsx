import { HashConnect, HashConnectTypes, MessageTypes } from "hashconnect";
import { AccountInfoQuery, Client, PublicKey, Transaction } from '@hashgraph/sdk';
import React, { useEffect, useState } from "react";

//Type declarations
interface SaveData {
  topic: string;
  pairingString: string;
  privateKey: string;
  pairedWalletData: HashConnectTypes.WalletMetadata | null;
  pairedAccounts: string[];
  netWork?: string;
  id?: string;
  accountIds?: string[];
}

type Networks = "testnet" | "mainnet" | "previewnet";

interface PropsType {
  children: React.ReactNode;
  hashConnect: HashConnect;
  netWork: Networks;
  metaData?: HashConnectTypes.AppMetadata;
  debug?: boolean;
}

export interface HashConnectProviderAPI {
  authenticate: (accountId: string) => void;
  connect: () => void;
  walletData: SaveData;
  netWork: Networks;
  metaData?: HashConnectTypes.AppMetadata;
  installedExtensions: HashConnectTypes.WalletMetadata | null;
}

const INITIAL_SAVE_DATA: SaveData = {
  topic: "",
  pairingString: "",
  privateKey: "",
  pairedAccounts: [],
  pairedWalletData: null,
};

let APP_CONFIG: HashConnectTypes.AppMetadata = {
  name: "Hedera Notification Service",
  description: "A communication layer connecting Web3 back to Web2, enabling DApps and smart contracts to notify users regarding important on-chain changes.",
  icon: "https://absolute.url/to/icon.png",
};

const loadLocalData = (): null | SaveData => {
  let foundData = localStorage.getItem("  hashConnectData");

  if (foundData) {
    const saveData: SaveData = JSON.parse(foundData);
    // setSaveData(saveData);
    return saveData;
  } else return null;
};

export const HashConnectAPIContext =
  React.createContext<HashConnectProviderAPI>({
    authenticate: (accountId: string) => null,
    connect: () => null,
    walletData: INITIAL_SAVE_DATA,
    netWork: "testnet",
    installedExtensions: null,
  });

export default function HashConnectProvider({
  children,
  hashConnect,
  metaData,
  netWork,
  debug,
}: PropsType) {
  //Saving Wallet Details in Ustate
  const [saveData, SetSaveData] = useState<SaveData>(INITIAL_SAVE_DATA);
  const [installedExtensions, setInstalledExtensions] =
    useState<HashConnectTypes.WalletMetadata | null>(null);

  //? Initialize the package in mount
  const initializeHashConnect = async () => {
    const saveData = INITIAL_SAVE_DATA;
    const localData = loadLocalData();
    try {
      if (!localData) {
        if (debug) console.log("===Local data not found.=====");

        //first init and store the private for later
        let initData = await hashConnect.init(metaData ?? APP_CONFIG);
        saveData.privateKey = initData.privKey;

        //then connect, storing the new topic for later
        const state = await hashConnect.connect();
        saveData.topic = state.topic;

        //generate a pairing string, which you can display and generate a QR code from
        saveData.pairingString = hashConnect.generatePairingString(
          state,
          netWork,
          debug ?? false
        );

        //find any supported local wallets
        hashConnect.findLocalWallets();
      } else {
        if (debug) console.log("====Local data found====", localData);
        //use loaded data for initialization + connection
        hashConnect.init(metaData ?? APP_CONFIG, localData?.privateKey);
        hashConnect.connect(
          localData?.topic,
          localData?.pairedWalletData ?? metaData
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      if (localData) {
        SetSaveData((prevData) => ({ ...prevData, ...localData }));
      } else {
        SetSaveData((prevData) => ({ ...prevData, ...saveData }));
      }
      if (debug) console.log("====Wallet details updated to state====");
    }
  };

  const saveDataInLocalStorage = (data: MessageTypes.ApprovePairing) => {
    if (debug)
      console.info("===============Saving to localstorage::=============");
    const { metadata, ...restData } = data;
    SetSaveData((prevSaveData) => {
      prevSaveData.pairedWalletData = metadata;
      return { ...prevSaveData, ...restData };
    });
    let dataToSave = JSON.stringify(data);
    localStorage.setItem("hashconnectData", dataToSave);
  };

  const foundExtensionEventHandler = (data: HashConnectTypes.WalletMetadata) => {
    if (debug) console.debug("====foundExtensionEvent====", data);
    // Do a thing
    setInstalledExtensions(data);
  };

  const pairingEventHandler = (data: MessageTypes.ApprovePairing) => {
    if (debug) console.log("====pairingEvent:::Wallet connected=====", data);
    // Save Data to localStorage
    saveDataInLocalStorage(data);
  };

  useEffect(() => {
    //Intialize the setup
    initializeHashConnect();

    // Attach event handlers
    hashConnect.foundExtensionEvent.on(foundExtensionEventHandler);
    hashConnect.pairingEvent.on(pairingEventHandler);

    return () => {
      // Detach existing handlers
      hashConnect.foundExtensionEvent.off(foundExtensionEventHandler);
      hashConnect.pairingEvent.off(pairingEventHandler);
    };
  }, []);

  const connect = () => {
    if (installedExtensions) {
      if (debug) console.log("Pairing String::", saveData.pairingString);
      hashConnect.connectToLocalWallet(saveData?.pairingString);
    } else {
      if (debug) console.log("====No Extension is not in browser====");
      return "wallet not installed";
    }
  };

  const authenticate = async (accountId: string) => {
    let res = await hashConnect.authenticate(saveData.topic, accountId);

    if(!res.success) {
      console.log("====Authentication failed====");
      //user rejected authentication request
      return;
    }

    //FOLLOWING IS EXAMPLE ONLY
    //!!!!!!!!!! DO NOT DO THIS ON THE CLIENT SIDE - YOU MUST PASS THE TRANSACTION BYTES TO THE SERVER AND VERIFY THERE
    // after verified on the server, generate some sort of auth token to use with your backend

    let trans = Transaction.fromBytes(res.signedTransaction as Uint8Array);

    let url = "https://testnet.mirrornode.hedera.com/api/v1/accounts/" + accountId;

    fetch(url, { method: "GET"}).then(async res => {
      if (res.ok) {
        let data = await res.json();
        console.log("Got account info")
        console.log("====Account Data====", data);

        let pubKey = PublicKey.fromString(data.key.key);
        console.log("====Public Key====", pubKey);
        let authenticated = pubKey.verifyTransaction(trans as Transaction)
        console.log("authenticated: ", authenticated)
        //if authenticated is true, do your token generation
      } else {
        alert("Error getting public key");
      }
    })
    //!!!!!!!!!! DO NOT DO THIS ON THE CLIENT SIDE - YOU MUST PASS THE TRANSACTION BYTES TO THE SERVER AND VERIFY THERE

  }

  return (
    <HashConnectAPIContext.Provider
      value={{ authenticate, connect, walletData: saveData, netWork, installedExtensions }}
    >
      {children}
    </HashConnectAPIContext.Provider>
  );
}

const defaultProps: Partial<PropsType> = {
  metaData: {
    name: "Hedera Notification Service",
    description: "A communication layer connecting Web3 back to Web2, enabling DApps and smart contracts to notify users regarding important on-chain changes.",
    icon: "https://absolute.url/to/icon.png",
  },
  netWork: "testnet",
  debug: false,
};

HashConnectProvider.defaultProps = defaultProps;

export function useHashConnect() {
  const value = React.useContext(HashConnectAPIContext);
  return value;
}