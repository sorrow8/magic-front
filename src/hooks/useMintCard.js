/* global BigInt */
import { useState } from 'react';
import { useLaserEyes } from '@omnisat/lasereyes-react';
import axios from 'axios';
import * as bitcoin from 'bitcoinjs-lib';
import { Provider } from '@oyl/sdk/lib/provider/provider';
import { getAddressType, formatInputsToSign } from '@oyl/sdk/lib/shared/utils';

import { 
  encodeRunestoneProtostone, 
  ProtoStone, 
  encipher
} from 'alkanes/lib/index';

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

function getTaprootScriptFromPubkey(pubkey) {
  if (!pubkey) {
    return null;
  }
  const pubkeyBuffer = Buffer.from(pubkey, 'hex');
  // Для taproot нужен x-only pubkey (32 байта)
  const xOnlyPubkey = pubkeyBuffer.length === 33 ? pubkeyBuffer.slice(1) : pubkeyBuffer;
  const p2tr = bitcoin.payments.p2tr({
    internalPubkey: xOnlyPubkey,
    network: bitcoin.networks.bitcoin
  });
  return p2tr.output.toString('hex');
}

export function useMintCard() {
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const { connected, address, paymentAddress, paymentPublicKey, publicKey, signPsbt } = useLaserEyes();
  const scriptPk = paymentPublicKey ? getScriptPkFromPubkey(paymentPublicKey) : null;
  const taprootScriptPk = publicKey ? getTaprootScriptFromPubkey(publicKey) : null;

  const mintCard = async (feeRateParam, selectedUtxo) => {
    if (!connected || !address) {
      throw new Error('Wallet not connected');
    }

    if (!selectedUtxo) {
      throw new Error('No ARBUZ UTXO selected');
    }

    setMinting(true);
    setError(null);
    setResult(null);

    try {

      
      const feeRate = feeRateParam || 4;
      const networkConfig = bitcoin.networks.bitcoin;
      const providerUrl = 'https://mainnet.sandshrew.io/v2/lasereyes'; 
      
      // Parent contract data for minting card
      const param1 = 2;
      const param2 = 1020; // example
      const param3 = 77;

      const calldata = encipher([
        BigInt(param1),
        BigInt(param2), 
        BigInt(param3)
      ]);

      const edicts = [];

      const protostoneData = {
        protocolTag: 1n,
        edicts: edicts.length > 0 ? edicts : [],
        pointer: 0,
        refundPointer: 0,
        calldata,
      };

      const protostone = encodeRunestoneProtostone({
        protostones: [ProtoStone.message(protostoneData)],
      }).encodedRunestone;

      // Get UTXOs for fee payment (like in useSwap)
      const response = await fetch(providerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "jsonrpc": "2.0", 
          "id": 1, 
          "method": "esplora_address::utxo",
          "params": [paymentAddress]
        })
      });

      const data = await response.json();
      
      if (!data.result) {
        throw new Error('Failed to get UTXOs from API');
      }
      
      const sortedUtxos = [...data.result].sort((a, b) => b.value - a.value);

      // Исключаем выбранный ARBUZ UTXO из списка для оплаты комиссии
      const filteredUtxos = sortedUtxos.filter(utxo => 
        !(utxo.txid === selectedUtxo.outpoint.txid && utxo.vout === selectedUtxo.outpoint.vout)
      );
      
      // Select UTXOs for fee payment
      const outputAmount = 330;
      const requiredAmount = outputAmount + Math.ceil(feeRate * 300);
      
      let selectedUtxos = [];
      let total = 0;

      for (const utxo of filteredUtxos) {
        selectedUtxos.push(utxo);
        total += utxo.value;
        if (total >= requiredAmount) break;
      }

      if (total < requiredAmount) {
        throw new Error(`Insufficient funds: required ${requiredAmount} sats in segwit, available only ${total}`);
      }

      // Create Provider for estimation
      const provider = new Provider({
        url: 'https://mainnet.sandshrew.io',
        version: 'v2',
        projectId: 'lasereyes',
        network: networkConfig,
        networkType: 'mainnet'
      });

      // Build estimation PSBT (like in useSwap)
      let estimationPsbt = new bitcoin.Psbt({ network: networkConfig });

      // Add selected ARBUZ UTXO as taproot input (like token UTXOs in useSwap)
      // Временно убираем проверку UTXO, так как она может быть неточной
      // Функция для реверса txid (если нужно)
      const reverseTxid = (txid) => {
        return txid.match(/.{2}/g).reverse().join('');
      };
      
      const originalTxid = selectedUtxo.outpoint.txid;
      const reversedTxid = reverseTxid(originalTxid);
      
      console.log('🔍 TXID formats:', {
        original: originalTxid,
        reversed: reversedTxid,
        vout: selectedUtxo.outpoint.vout,
        value: selectedUtxo.output.value
      });


      
              estimationPsbt.addInput({
          hash: reversedTxid, // Пробуем reversed txid
          index: selectedUtxo.outpoint.vout,
          witnessUtxo: {
            value: selectedUtxo.output.value,
            script: Buffer.from(taprootScriptPk, 'hex'),
          },
        });

      // Add UTXOs for fee payment (like in useSwap)
      for (let i = 0; i < selectedUtxos.length; i++) {
        const utxo = selectedUtxos[i];
        
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
          const previousTxHex = await provider.esplora.getTxHex(utxo.txid);
          estimationPsbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            nonWitnessUtxo: Buffer.from(previousTxHex, 'hex'),
          });
        }
      }

             const totalInputValue = selectedUtxo.output.value + total;
      
      estimationPsbt.addOutput({
        address: address,
        value: outputAmount,
      });
      
      estimationPsbt.addOutput({
        script: protostone,
        value: 0,
      });

      const changeAmount = total - outputAmount - Math.ceil(feeRate * 300);
      if (changeAmount > 546) {
        estimationPsbt.addOutput({
          address: paymentAddress,
          value: changeAmount,
        });
      }

      // Format and estimate (like in useSwap)
      const formattedEstimationPsbt = await formatInputsToSign({
        _psbt: estimationPsbt,
        senderPublicKey: publicKey, // Use taproot key for first input
        network: networkConfig,
      });
      
      const estimationPsbtObj = bitcoin.Psbt.fromBase64(formattedEstimationPsbt.toBase64(), {
        network: networkConfig,
      });

      // Add fake signatures for size estimation
      for (let i = 0; i < estimationPsbtObj.data.inputs.length; i++) {
        const fakeSig = Buffer.alloc(64, 0x00);
        
        // First input is ARBUZ UTXO (taproot), others are payment UTXOs
        if (i === 0) {
          // For taproot (P2TR) input use simple witness signature
          estimationPsbtObj.data.inputs[i].finalScriptWitness = bitcoin.script.compile([fakeSig]);
          estimationPsbtObj.data.inputs[i].finalScriptSig = Buffer.alloc(0);
        } else {
          // For payment UTXOs use existing logic
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
      }

      const estimationTx = estimationPsbtObj.extractTransaction();
      const vSize = estimationTx.virtualSize() + 30;
      const actualFee = Math.ceil(vSize * feeRate);

      // Build final PSBT (like in useSwap)
      let finalPsbt = new bitcoin.Psbt({ network: networkConfig });

      // Add selected ARBUZ UTXO as taproot input
      finalPsbt.addInput({
        hash: reversedTxid, // Пробуем reversed txid
        index: selectedUtxo.outpoint.vout,
        witnessUtxo: {
          value: selectedUtxo.output.value,
          script: Buffer.from(taprootScriptPk, 'hex'),
        },
      });
      
      // Add UTXOs for fee payment
      for (let i = 0; i < selectedUtxos.length; i++) {
        const utxo = selectedUtxos[i];
        
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

      finalPsbt.addOutput({
        address: address,
        value: outputAmount,
      });
      
      finalPsbt.addOutput({
        script: protostone,
        value: 0,
      });

      const finalChangeAmount = totalInputValue - outputAmount - actualFee;
      
      if (finalChangeAmount > 546) {
        finalPsbt.addOutput({
          address: paymentAddress,
          value: finalChangeAmount,
        });
      }

      const formattedFinalPsbt = await formatInputsToSign({
        _psbt: finalPsbt,
        senderPublicKey: publicKey, // Use taproot key
        network: networkConfig,
      });
      
      const psbtBase64 = formattedFinalPsbt.toBase64();

      const signResponse = await signPsbt(psbtBase64, true, false);
      const signedPsbtHex = signResponse.signedPsbtHex;
      
      const signedPsbt = bitcoin.Psbt.fromHex(signedPsbtHex);
      const finalTransaction = signedPsbt.extractTransaction();
      const rawTxHex = finalTransaction.toHex();

      // Broadcast transaction
      const broadcastResponse = await axios.post(providerUrl, {
        jsonrpc: "2.0",
        id: 1,
        method: "btc_sendrawtransaction",
        params: [rawTxHex]
      });

      if (broadcastResponse.data.error) {
        throw new Error(`Broadcast failed: ${broadcastResponse.data.error.message}`);
      }

      const txid = broadcastResponse.data.result;
      
      console.log('🎉 ТРАНЗАКЦИЯ МИНТА ОТПРАВЛЕНА!');
      console.log('🔗 Transaction ID:', txid);
      console.log('📄 Raw Transaction:', rawTxHex);
      console.log('🌐 Explorer Link:', `https://mempool.space/tx/${txid}`);

      const resultData = {
        txid,
        rawTxHex,
        success: true,
        message: 'Mint transaction sent successfully!'
      };

      setResult(resultData);
      return resultData;

    } catch (err) {
      // Специальная обработка ошибки отмены подписания кошелька
      if (err.message && 
          (err.message.includes('Approval request was cancelled') || 
           err.message.includes('OylConnectError') ||
           err.message.includes('cancelled') ||
           err.message.includes('User rejected') ||
           err.message.includes('User cancelled'))) {
        console.log('💔 Card minting cancelled by user');
        setError('Transaction cancelled by user');
        const cancelledResult = {
          success: false,
          cancelled: true,
          message: 'Transaction cancelled by user'
        };
        setResult(cancelledResult);
        return cancelledResult;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Mint card error:', errorMessage);
      throw err;
    } finally {
      setMinting(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    mintCard,
    minting,
    error,
    result,
    txid: result?.txid, // Добавляем txid для совместимости
    clearResult,
    connected
  };
}

export default useMintCard; 