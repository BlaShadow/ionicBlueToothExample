import { IonButton, IonContent, IonHeader, IonInput, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import React, { useEffect, useState } from 'react';
// Import the wrapper class directly
import { BleClient, BleDevice, numbersToDataView, numberToUUID, ScanResult, } from '@capacitor-community/bluetooth-le';

import {Plugins} from "@capacitor/core";
import { BluetoothEnabledResult, BluetoothScanResult, BluetoothSerialPlugin, BluetoothDevice } from 'capacitor-bluetooth-serial';
 
const { BluetoothSerial } = Plugins;

const Bluetooth = BluetoothSerial as BluetoothSerialPlugin;

// Bluetooth LE
// https://github.com/capacitor-community/bluetooth-le

// Serial Bluetooth
// https://www.npmjs.com/package/capacitor-bluetooth-serial

const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';

const Home: React.FC = () => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  const pixel1 = 'AC:37:43:87:B5:0D';
  const pixel2 = '40:4E:36:5A:0E:21';

  const current = pixel1;

  useEffect(() => {
    // BleClient
    //   .initialize()
    //   .then(() => {
    //     setStatus(`Bluetooth is enabled`);
    //   })
    //   .catch(() => {
    //     setStatus(`Error Bluetooth`);
    //   });

    // BluetoothSerial
    //   .isEnabled()
    //   .then((response: BluetoothEnabledResult) => {
    //     const message = response.enabled ? 'enabled' : 'disabled';
    //     setStatus(`Bluetooth is ${message}`);
    //   })
    //   .catch(() => {
    //     setStatus(`Error Bluetooth`);
    //   });
  }, []);

  const [device, setDevice] = useState<BleDevice | undefined>(undefined);

  const main = () => {
    BleClient.initialize()
      .then(() => BleClient.requestDevice({
        services: [HEART_RATE_SERVICE],
        optionalServices: [],
      }))
      .then((item) => {
        addMessage('Device found!');

        setDevice(item);

        return Promise.all([Promise.resolve(item), BleClient.connect(item.deviceId)]) ;
      })
      .then(([device, result]) => {
        addMessage('Device Connected!');
        addMessage(`About to listen ! ${device.deviceId} ${device.name}`);
        return BleClient.startNotifications(
          device.deviceId,
          HEART_RATE_SERVICE,
          HEART_RATE_MEASUREMENT_CHARACTERISTIC,
          value => {
            addMessage(`Current heart rate ${parseHeartRate(value)}`);
          },
        )
      })
      .then(() => {
        addMessage('Listening notifications!');
      })
      .catch((error) => {
        addMessage(`Error: ${error}`);
      });
  }

  const disconnect = () => {
    BleClient.stopNotifications(
      device?.deviceId || '',
      HEART_RATE_SERVICE,
      HEART_RATE_MEASUREMENT_CHARACTERISTIC,
    ).then(() => {
      addMessage(`Stop Notification ${device?.deviceId} ${device?.name}`);  

      return BleClient.disconnect(device?.deviceId || '');
    }).then(() => {
      addMessage(`disconnected from device ${device}`);
    }).catch((error) => {
      addMessage(`Error ${error}`);
    });
  }

  function parseHeartRate(value: DataView): number {
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    let heartRate: number;
    if (rate16Bits > 0) {
      heartRate = value.getUint16(1, true);
    } else {
      heartRate = value.getUint8(1);
    }
    return heartRate;
  }

  const scanLowEnergy = () => {
    BleClient.requestDevice({
    })
      .then(() => {

      })
      .catch(() => {
      })
  }

  const scanNice = () => {
    setStatus(`Scanning...`);
    setDevices([]);

    BluetoothSerial
      .isEnabled()
      .then(() => Bluetooth.scan())
      .then((result: BluetoothScanResult) => {
        setDevices(result.devices);

        setStatus(`Result ${result.devices.length}`);
      })
      .catch(() => {
        setStatus(`Error scanning`);
      });
  }

  const connectar = (device: BluetoothDevice) => {
    const address = current;

    setStatus(`Attemping to connect to ${address}`);

    Bluetooth.connect({address: address})
      .then(() => {
        setStatus(`Connected ${address}`);
      })
      .catch((error) => {
        setStatus(`${error}`);
      });

      // Bluetooth
      //   .readUntil({address: address, delimiter: 'end'})
      //   .then(() => {

      //   })
      //   .catch((error) => {
      //     setStatus(`Error reading for device ${error}`);
      //   });
  }

  const addMessage = (message: string) => {
    setMessages((prev) => [`${new Date().toTimeString()}: ${message}`, ...prev]);
    setMessage('');
  }

  const sendMessage = (message: string) => {
    addMessage(message);

    BluetoothSerial
      .write({
        address: current,
        value: message,
      })
      .then(() => {
        setStatus(`Error reading for device`);
        setStatus('Value sent to device');
      })
      .catch(() => {
        setStatus('Error writing data to device');
      });      
  }

  // Pixel AC:37:43:87:B5:0D
  // Pixel2 40:4e:36:5a:0e21

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Blank</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Blank</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <h5>Status: {status}</h5>

        
        <IonButton onClick={main}>Scan</IonButton>
        <IonButton onClick={disconnect}>Disconnect</IonButton>
        
        <div style={{display: 'flex', flexDirection: 'row', overflow: 'scroll'}}>
          {devices.map((item) => {
            return (
              <div key={item.id} style={{width: 150, margin: 5, padding: 5, borderColor: 'black', borderWidth: 1, borderStyle: 'solid'}}>
                <p>
                  {item.address}
                </p>
                <IonButton onClick={() => connectar(item)}>Connectar</IonButton>
              </div>
            );
          })}
        </div>

        <div>
          {messages.map((item, index) => {
            return (
              <div key={index}>{item}</div>
            );
          })}
        </div>

        <div>
          <IonInput value={message} placeholder="Message" onIonChange={e => setMessage(e.detail.value!)}></IonInput>
          <IonButton onClick={() => sendMessage(message)}>Enviar</IonButton>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Home;
