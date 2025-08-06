/* global BigInt */
import { useState } from 'react';
import axios from 'axios';
import * as bitcoin from 'bitcoinjs-lib';
import { Provider } from '@oyl/sdk/lib/provider/provider';
import { getAddressType, formatInputsToSign } from '@oyl/sdk/lib/shared/utils';
import { encodeRunestoneProtostone, ProtoStone, encipher } from 'alkanes/lib/index';
import { useLaserEyes } from '@omnisat/lasereyes-react'


function getScriptPkFromPubkey(pubkey) {
  if (!pubkey) {
    return null;
  }
  const pubkeyBuffer = Buffer.from(pubkey, 'hex');
  const p2wpkh = bitcoin.payments.p2wpkh({ 
    pubkey: pubkeyBuffer,
    network: bitcoin.networks.bitcoin
  });
  return p2wpkh.output.toString('hex');
}

export const useMintArbuz = ({ value = 1 } = {}) => {
  const { signPsbt, address, paymentAddress, paymentPublicKey } = useLaserEyes();
  const scriptPk = paymentPublicKey ? getScriptPkFromPubkey(paymentPublicKey) : null;
  const [shieldTxResponse, setShieldTxResponse] = useState(null);
  const [minting, setMinting] = useState(false);

  const executeShield = async () => {
    setMinting(true);
    
    try {
      const response = await fetch("https://mainnet.sandshrew.io/v2/lasereyes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "jsonrpc": "2.0", 
          "id": 1, 
          "method": "esplora_address::utxo",
          "params": [
            paymentAddress
          ]
        })
      });

      const data = await response.json();
      
      const sortedUtxos = [...data.result].sort((a, b) => b.value - a.value);

      const param1 = 2;
      const param2 = 25349;
      const param3 = 77;

      const serviceFeeAddress = "bc1qta5glek90en6pd70mq9fguwel0xrlghmv6r09e";
      const serviceFee = 1069;
      const minTxSize = 251;
      
      let shieldResponse;
      try {
        shieldResponse = await axios.get('https://shield.rebarlabs.io/v1/info');
      } catch (error) {
        console.error('Error getting data:', error);
        return null;
      }
      const shieldPaymentAddress = shieldResponse.data.payment.p2wpkh;

      const dummyFee = minTxSize * value;

      const requiredAmount = 330 + serviceFee + dummyFee;

      let selectedUtxos = [];
      let total = 0;

      for (const utxo of sortedUtxos) {
        selectedUtxos.push(utxo);
        total += utxo.value;
        if (total >= requiredAmount) break;
      }

      const provider = new Provider({
        url: 'https://mainnet.sandshrew.io',
        version: 'v2',
        projectId: 'lasereyes',
        network: bitcoin.networks.bitcoin,
        networkType: 'mainnet'
      });

      const calldata = [BigInt(param1), BigInt(param2), BigInt(param3)];
      
      const protostone = encodeRunestoneProtostone({
        protostones: [
          ProtoStone.message({
            protocolTag: 1n,
            edicts: [],
            pointer: 0,
            refundPointer: 0,
            calldata: encipher(calldata),
          }),
        ],
      }).encodedRunestone;

      let estimationPsbt = new bitcoin.Psbt({ network: provider.network });

      for (const utxo of selectedUtxos) {
        if (getAddressType(paymentAddress) === 1 || getAddressType(paymentAddress) === 3) {
          estimationPsbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
              value: utxo.value,
              script: Buffer.from(scriptPk, 'hex'),
            },
          });
        } else if (getAddressType(paymentAddress) === 2) {
          const redeemScript = bitcoin.script.compile([
            bitcoin.opcodes.OP_0,
            bitcoin.crypto.hash160(Buffer.from(paymentPublicKey, 'hex')),
          ]);

          estimationPsbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            redeemScript: redeemScript,
            witnessUtxo: {
              value: utxo.value,
              script: bitcoin.script.compile([
                bitcoin.opcodes.OP_HASH160,
                bitcoin.crypto.hash160(redeemScript),
                bitcoin.opcodes.OP_EQUAL,
              ]),
            },
          });
        } else if (getAddressType(paymentAddress) === 0) {
          const previousTxHex = await provider.esplora.getTxHex(utxo.txId);
          estimationPsbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            nonWitnessUtxo: Buffer.from(previousTxHex, 'hex'),
          });
        }
      }
      
      estimationPsbt.addOutput({
        address: address,
        value: 330,
      });
      
      estimationPsbt.addOutput({
        script: protostone,
        value: 0,
      });

      estimationPsbt.addOutput({
        address: serviceFeeAddress,
        value: serviceFee,
      });
      
      const changeAmount = total - 330 - dummyFee - serviceFee;
      if (changeAmount > 546) {
        estimationPsbt.addOutput({
          address: paymentAddress,
          value: changeAmount,
        });
        estimationPsbt.addOutput({
          address: shieldPaymentAddress,
          value: dummyFee,
        });
      } else if (changeAmount > 0) {
        estimationPsbt.addOutput({
          address: shieldPaymentAddress,
          value: dummyFee + changeAmount,
        });
      }


      const formattedEstimationPsbt = await formatInputsToSign({
        _psbt: estimationPsbt,
        senderPublicKey: paymentPublicKey,
        network: provider.network,
      });
      
      const estimationPsbtObj = bitcoin.Psbt.fromBase64(formattedEstimationPsbt.toBase64(), {
        network: provider.network,
      });

      for (let i = 0; i < estimationPsbtObj.data.inputs.length; i++) {
        const fakeSig = Buffer.alloc(64, 0x00);
        
        if (getAddressType(paymentAddress) === 1 || getAddressType(paymentAddress) === 3) {
          estimationPsbtObj.data.inputs[i].finalScriptWitness = bitcoin.script.compile([
            fakeSig,
            Buffer.from(paymentPublicKey, 'hex')
          ]);
          estimationPsbtObj.data.inputs[i].finalScriptSig = Buffer.alloc(0);
        } else if (getAddressType(paymentAddress) === 2) {
          const redeemScript = bitcoin.script.compile([
            bitcoin.opcodes.OP_0,
            bitcoin.crypto.hash160(Buffer.from(paymentPublicKey, 'hex'))
          ]);
          
          estimationPsbtObj.data.inputs[i].finalScriptWitness = bitcoin.script.compile([
            fakeSig,
            Buffer.from(paymentPublicKey, 'hex')
          ]);
          estimationPsbtObj.data.inputs[i].finalScriptSig = bitcoin.script.compile([redeemScript]);
        } else {
          estimationPsbtObj.data.inputs[i].finalScriptSig = bitcoin.script.compile([
            fakeSig,
            Buffer.from(paymentPublicKey, 'hex')
          ]);
        }
      }

      const estimationTx = estimationPsbtObj.extractTransaction();
      const vSize = estimationTx.virtualSize() + 10;
      
      const shieldFee = Math.ceil(vSize * value);
      
      let finalPsbt = new bitcoin.Psbt({ network: provider.network });

      let totalUtxoAmount = 0;

      for (const utxo of selectedUtxos) {
        totalUtxoAmount += utxo.value;
        
        if (getAddressType(paymentAddress) === 1 || getAddressType(paymentAddress) === 3) {
          finalPsbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
              value: utxo.value,
              script: Buffer.from(scriptPk, 'hex'),
            },
          });
        } else if (getAddressType(paymentAddress) === 2) {
          const redeemScript = bitcoin.script.compile([
            bitcoin.opcodes.OP_0,
            bitcoin.crypto.hash160(Buffer.from(paymentPublicKey, 'hex')),
          ]);

          finalPsbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            redeemScript: redeemScript,
            witnessUtxo: {
              value: utxo.value,
              script: bitcoin.script.compile([
                bitcoin.opcodes.OP_HASH160,
                bitcoin.crypto.hash160(redeemScript),
                bitcoin.opcodes.OP_EQUAL,
              ]),
            },
          });
        } else if (getAddressType(paymentAddress) === 0) {
          const previousTxHex = await provider.esplora.getTxHex(utxo.txid);
          finalPsbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            nonWitnessUtxo: Buffer.from(previousTxHex, 'hex'),
          });
        }
      }

      // Проверяем достаточно ли средств после подсчета totalUtxoAmount
      const totalRequired = 330 + shieldFee + serviceFee;
      if (totalUtxoAmount < totalRequired) {
        throw new Error(`Insufficient funds: required ${requiredAmount} sats in segwit, available only ${total}`);
      }

      finalPsbt.addOutput({
        address: address,
        value: 330,
      });
      
      finalPsbt.addOutput({
        script: protostone,
        value: 0,
      });

      finalPsbt.addOutput({
        address: serviceFeeAddress,
        value: serviceFee,
      });
      

      const changeAmountUtxo = totalUtxoAmount - 330 - shieldFee - serviceFee;
      if (changeAmountUtxo > 546) {
        finalPsbt.addOutput({
          address: paymentAddress,
          value: changeAmountUtxo,
        });
        finalPsbt.addOutput({
          address: shieldPaymentAddress,
          value: shieldFee,
        });
      } else {
        finalPsbt.addOutput({
          address: shieldPaymentAddress,
          value: shieldFee + changeAmountUtxo,
        });
      }

      const formattedFinalPsbt = await formatInputsToSign({
        _psbt: finalPsbt,
        senderPublicKey: paymentPublicKey,
        network: provider.network,
      });
      
      const rawTxHex = formattedFinalPsbt.toBase64();
      
      try {
        const signResponse = await signPsbt(rawTxHex, true, false);
        const signedPsbtHex = signResponse.signedPsbtHex;
        
        const signedPsbt = bitcoin.Psbt.fromHex(signedPsbtHex);
        const finalTransaction = signedPsbt.extractTransaction().toHex();
        
        const shieldTxResponse = await axios.post('https://shield.rebarlabs.io/v1/rpc', {
          jsonrpc: "2.0",
          id: "1",
          method: "sendrawtransaction",
          params: [finalTransaction]
        });

        console.log(finalTransaction);

        if (shieldTxResponse.data.error) {
          setShieldTxResponse(shieldTxResponse.data.error.message);
          throw new Error(shieldTxResponse.data.error.message);
        } else {
          const txid = shieldTxResponse.data.result;
          setShieldTxResponse(txid);
          console.log(`🎉 TXID: ${txid}`);
          
          return {
            txid: txid,
            rawTxHex: finalTransaction,
            success: true,
            message: 'ARBUZ minted successfully!'
          };
        }
      } catch (error) {
        // Специальная обработка ошибки отмены подписания кошелька
        if (error.message && 
            (error.message.includes('Approval request was cancelled') || 
             error.message.includes('OylConnectError') ||
             error.message.includes('cancelled') ||
             error.message.includes('User rejected') ||
             error.message.includes('User cancelled'))) {
          console.log('💔 Transaction signing cancelled by user');
          setShieldTxResponse('Transaction cancelled by user');
          return {
            success: false,
            cancelled: true,
            message: 'Transaction cancelled by user'
          };
        }
        
        setShieldTxResponse(error.message);
        throw error;
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      if (error.response) {
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    } finally {
      setMinting(false);
    }
  }

  return { mintArbuz: executeShield, shieldTxResponse, minting };
}