/* global BigInt */
import { useState } from 'react';
import axios from 'axios';
import * as bitcoin from 'bitcoinjs-lib';

import { 
  encodeRunestoneProtostone, 
  ProtoStone, 
  encipher
} from 'alkanes/lib/index';

import { mnemonicToAccount, getWalletPrivateKeys } from '@oyl/sdk/lib/account/account';
import { Provider } from '@oyl/sdk/lib/provider/provider';
import { Signer } from '@oyl/sdk/lib/signer/signer';
import * as utxo from '@oyl/sdk/lib/utxo/utxo';
import { findXAmountOfSats, getAddressType, formatInputsToSign } from '@oyl/sdk/lib/shared/utils';

export function useResolve2() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const resolveContract2 = async (param1, param2, param3, tokenAmount, manualUtxo) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const mnemonic = "jacket weapon ceiling stool vote consider banana depth daring trip pig sauce";
      
      const provider = new Provider({
        url: 'http://localhost:18888',
        version: '',
        projectId: '',
        network: bitcoin.networks.regtest,
        networkType: 'regtest'
      });

      const account = mnemonicToAccount({ 
        mnemonic, 
        opts: { network: provider.network } 
      });
      
      const privateKeys = getWalletPrivateKeys({ 
        mnemonic, 
        opts: { network: account.network } 
      });
      
      const signer = new Signer(account.network, {
        taprootPrivateKey: privateKeys.taproot.privateKey,
        segwitPrivateKey: privateKeys.nativeSegwit.privateKey,
        nestedSegwitPrivateKey: privateKeys.nestedSegwit.privateKey,
        legacyPrivateKey: privateKeys.legacy.privateKey,
      });

      // Получение UTXOs
      const { accountSpendableTotalUtxos, accountSpendableTotalBalance } = 
        await utxo.accountUtxos({ account, provider });
      
      console.log(`🟡 [RESOLVE2] Total spendable balance: ${accountSpendableTotalBalance} sats`);
      console.log(`🟡 [RESOLVE2] Number of UTXOs: ${accountSpendableTotalUtxos.length}`);

      // Использование ручного выбора UTXO для токенов
      let alkanesUtxos = [];
      if (tokenAmount > 0) {
        if (!manualUtxo) {
          throw new Error('Token amount specified but no manual UTXO provided. Please specify UTXO with txId:outputIndex');
        }

        console.log(`🟡 [RESOLVE2] Using manually specified UTXO: ${manualUtxo.txId}:${manualUtxo.outputIndex}`);
        
        // Получаем информацию о UTXO через RPC
        const utxoResponse = await axios.post('http://localhost:18888', {
          jsonrpc: "2.0",
          method: "gettxout",
          params: [manualUtxo.txId, manualUtxo.outputIndex, false],
          id: 1
        });
        
        if (!utxoResponse.data.result) {
          throw new Error(`UTXO ${manualUtxo.txId}:${manualUtxo.outputIndex} not found or already spent`);
        }
        
        console.log(`🟡 [RESOLVE2] UTXO info:`, utxoResponse.data.result);
        
        const tokenUtxo = {
          txId: manualUtxo.txId,
          outputIndex: manualUtxo.outputIndex,
          satoshis: Math.round(utxoResponse.data.result.value * 100000000), // Convert BTC to sats
          address: "bcrt1pa3s736wjyesxn8sxr3nrwetk3ccz8qta5h3flnlnlj9rmecerknq64ncj3",
          scriptPk: utxoResponse.data.result.scriptPubKey.hex
        };
        
        alkanesUtxos.push(tokenUtxo);
        console.log(`🟡 [RESOLVE2] Using manual UTXO: ${tokenUtxo.txId}:${tokenUtxo.outputIndex} (${tokenUtxo.satoshis} sats)`);
      }

      // Создание protostone для resolve2 опкода (с другими параметрами)
      console.log(`🟡 [RESOLVE2] Creating protostone for Resolve2 contract...`);
      console.log(`🟡 [RESOLVE2] Token amount: ${tokenAmount} tokens`);
      
      // Правильный формат calldata для resolve2 опкода
      const BIDS_CONTRACT_BLOCK = BigInt(param1);  // блок контракта
      const BIDS_CONTRACT_TX = BigInt(param2);     // транзакция контракта
      const RESOLVE_OPCODE = BigInt(param3);       // opcode для resolve
      
      console.log(`🟡 [RESOLVE2] Contract: ${BIDS_CONTRACT_BLOCK}:${BIDS_CONTRACT_TX}, Resolve Opcode: ${RESOLVE_OPCODE}`);
      console.log(`🟡 [RESOLVE2] Using SINGLE protostone with tokens AND calldata combined`);
      
      // Другие параметры для resolve2
      const calldata = encipher([
        BIDS_CONTRACT_BLOCK,  // блок контракта
        BIDS_CONTRACT_TX,     // транзакция контракта  
        RESOLVE_OPCODE,
        1n,       // resolve opcode 
        300n,                 // другое значение
      ]);

      // Создание edicts для токенов (если есть)
      const edicts = [];
      
      if (tokenAmount > 0) {
        const edict = {
          id: { block: 2n, tx: 3n },        // токен ID
          amount: BigInt(tokenAmount),       // количество токенов
          output: 0,                        // на output #0
        };
        edicts.push(edict);
        console.log(`🟡 [RESOLVE2] Created token edict:`, edict);
      }

      // Один протостоун с токенами И calldata для resolve2
      const protostoneData = {
        protocolTag: 1n,
        edicts: tokenAmount > 0 ? edicts : [],  // токены (если есть)
        pointer: 0,
        refundPointer: 0,
        calldata,                              // calldata для resolve2
      };
      
      console.log(`🟡 [RESOLVE2] Final protostone structure:`, {
        hasEdicts: protostoneData.edicts.length > 0,
        hasCalldata: protostoneData.calldata.length > 0,
        edictCount: protostoneData.edicts.length
      });
      
      const protostone = encodeRunestoneProtostone({
        protostones: [ProtoStone.message(protostoneData)],
      }).encodedRunestone;

      const requiredAmount = 330;
      console.log(`🟡 [RESOLVE2] Required funds: ${requiredAmount} sats`);

      if (accountSpendableTotalBalance < requiredAmount) {
        throw new Error(`Insufficient funds! Required: ${requiredAmount} sats, available: ${accountSpendableTotalBalance} sats`);
      }

      // Оценка размера транзакции (как в useBid.js)
      const initialUtxos = findXAmountOfSats(accountSpendableTotalUtxos, 330);
      let estimationPsbt = new bitcoin.Psbt({ network: provider.network });
      
      // Добавление inputs для оценки
      // 1️⃣ СНАЧАЛА добавляем alkane inputs  
      for (const utxo of alkanesUtxos) {
        console.log(`🟡 [RESOLVE2] Adding alkane input: ${utxo.txId}:${utxo.outputIndex}`);
        estimationPsbt.addInput({
          hash: utxo.txId,
          index: utxo.outputIndex,
          witnessUtxo: {
            value: utxo.satoshis,
            script: Buffer.from(utxo.scriptPk, 'hex'),
          },
        });
      }

      // 2️⃣ ПОТОМ добавляем обычные inputs
      for (const utxo of initialUtxos.utxos) {
        // Пропускаем UTXO которые уже добавили как alkane
        if (alkanesUtxos.some(alkaneUtxo => 
          alkaneUtxo.txId === utxo.txId && alkaneUtxo.outputIndex === utxo.outputIndex
        )) {
          continue;
        }
        if (getAddressType(utxo.address) === 1 || getAddressType(utxo.address) === 3) {
          estimationPsbt.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            witnessUtxo: {
              value: utxo.satoshis,
              script: Buffer.from(utxo.scriptPk, 'hex'),
            },
          });
        } else if (getAddressType(utxo.address) === 2) {
          const redeemScript = bitcoin.script.compile([
            bitcoin.opcodes.OP_0,
            bitcoin.crypto.hash160(Buffer.from(account.nestedSegwit.pubkey, 'hex')),
          ]);

          estimationPsbt.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            redeemScript: redeemScript,
            witnessUtxo: {
              value: utxo.satoshis,
              script: bitcoin.script.compile([
                bitcoin.opcodes.OP_HASH160,
                bitcoin.crypto.hash160(redeemScript),
                bitcoin.opcodes.OP_EQUAL,
              ]),
            },
          });
        } else if (getAddressType(utxo.address) === 0) {
          const previousTxHex = await provider.esplora.getTxHex(utxo.txId);
          estimationPsbt.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            nonWitnessUtxo: Buffer.from(previousTxHex, 'hex'),
          });
        }
      }
      
      // Добавление outputs для оценки
      estimationPsbt.addOutput({
        address: account.taproot.address,
        value: 330,
      });
      
      estimationPsbt.addOutput({
        script: protostone,
        value: 0,
      });

      const changeAmount = initialUtxos.totalAmount - 330;
      if (changeAmount >= 546) {
        estimationPsbt.addOutput({
          address: account.nativeSegwit.address,
          value: changeAmount,
        });
      }
      
      // Подписание для оценки размера
      const formattedEstimationPsbt = await formatInputsToSign({
        _psbt: estimationPsbt,
        senderPublicKey: account.taproot.pubkey,
        network: provider.network,
      });
      
      const { signedPsbt: signedEstimationPsbt } = await signer.signAllInputs({
        rawPsbt: formattedEstimationPsbt.toBase64(),
        finalize: true,
      });
      
      const estimationPsbtObj = bitcoin.Psbt.fromBase64(signedEstimationPsbt, {
        network: account.network,
      });
      
      const estimationTx = estimationPsbtObj.extractTransaction();
      const vSize = estimationTx.virtualSize();
      const totalFee = Math.ceil(vSize * 2);
      
      console.log(`🟡 [RESOLVE2] Estimated transaction size: ${vSize} vbytes`);
      console.log(`🟡 [RESOLVE2] Calculated fee: ${totalFee} sats`);
      
      const totalRequired = 330 + totalFee;

      // Создание финальной транзакции
      console.log(`🟡 [RESOLVE2] Building final transaction with correct fee...`);

      const gatheredUtxos = findXAmountOfSats(accountSpendableTotalUtxos, totalRequired);
      console.log(`🟡 [RESOLVE2] Gathered UTXOs for amount: ${gatheredUtxos.totalAmount} sats`);
      
      let finalPsbt = new bitcoin.Psbt({ network: provider.network });
      
      // Добавление inputs
      // 1️⃣ СНАЧАЛА добавляем alkane inputs
      for (const utxo of alkanesUtxos) {
        console.log(`🟡 [RESOLVE2] Adding alkane input to final PSBT: ${utxo.txId}:${utxo.outputIndex}`);
        finalPsbt.addInput({
          hash: utxo.txId,
          index: utxo.outputIndex,
          witnessUtxo: {
            value: utxo.satoshis,
            script: Buffer.from(utxo.scriptPk, 'hex'),
          },
        });
      }

      // 2️⃣ ПОТОМ добавляем обычные inputs
      for (const utxo of gatheredUtxos.utxos) {
        // Пропускаем UTXO которые уже добавили как alkane
        if (alkanesUtxos.some(alkaneUtxo => 
          alkaneUtxo.txId === utxo.txId && alkaneUtxo.outputIndex === utxo.outputIndex
        )) {
          console.log(`🟡 [RESOLVE2] Skipping duplicate UTXO: ${utxo.txId}:${utxo.outputIndex}`);
          continue;
        }
        if (getAddressType(utxo.address) === 1 || getAddressType(utxo.address) === 3) {
          finalPsbt.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            witnessUtxo: {
              value: utxo.satoshis,
              script: Buffer.from(utxo.scriptPk, 'hex'),
            },
          });
        } else if (getAddressType(utxo.address) === 2) {
          const redeemScript = bitcoin.script.compile([
            bitcoin.opcodes.OP_0,
            bitcoin.crypto.hash160(Buffer.from(account.nestedSegwit.pubkey, 'hex')),
          ]);

          finalPsbt.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            redeemScript: redeemScript,
            witnessUtxo: {
              value: utxo.satoshis,
              script: bitcoin.script.compile([
                bitcoin.opcodes.OP_HASH160,
                bitcoin.crypto.hash160(redeemScript),
                bitcoin.opcodes.OP_EQUAL,
              ]),
            },
          });
        } else if (getAddressType(utxo.address) === 0) {
          const previousTxHex = await provider.esplora.getTxHex(utxo.txId);
          finalPsbt.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            nonWitnessUtxo: Buffer.from(previousTxHex, 'hex'),
          });
        }
      }
      
      // Добавление outputs
      finalPsbt.addOutput({
        address: account.taproot.address,
        value: 330,
      }); 
      
      finalPsbt.addOutput({
        script: protostone,
        value: 0,
      });

      // Change output
      const finalChangeAmount = gatheredUtxos.totalAmount - totalFee - 330;

      if (finalChangeAmount >= 546) {
        finalPsbt.addOutput({
          address: account.nativeSegwit.address,
          value: finalChangeAmount,
        });
        console.log(`🟡 [RESOLVE2] Added change output: ${finalChangeAmount} sats`);
      } else {
        console.log(`🟡 [RESOLVE2] Change too small (${finalChangeAmount} sats), skipping`);
      }
      
      // Подписание финальной транзакции
      const formattedFinalPsbt = await formatInputsToSign({
        _psbt: finalPsbt,
        senderPublicKey: account.taproot.pubkey,
        network: provider.network,
      });
      
      console.log(`🟡 [RESOLVE2] Signing final transaction...`);
      const { signedPsbt } = await signer.signAllInputs({
        rawPsbt: formattedFinalPsbt.toBase64(),
        finalize: true,
      });
      
      // Извлечение hex транзакции
      const finalPsbtObj = bitcoin.Psbt.fromBase64(signedPsbt, {
        network: account.network,
      });
      const finalTx = finalPsbtObj.extractTransaction();
      const finalVSize = finalTx.virtualSize();
      const rawTxHex = finalTx.toHex();

      console.log(`🟡 [RESOLVE2] Transaction created successfully!`);
      console.log(`🟡 [RESOLVE2] Final transaction size: ${finalVSize} vbytes`);
      console.log(`🟡 [RESOLVE2] Final fee: ${totalFee} sats (${(totalFee/finalVSize).toFixed(2)} sats/vbyte)`);
      
      // Отправка транзакции
      const sandShrewResponse = await axios.post('http://localhost:18888', {
        jsonrpc: "2.0",
        id: 1,
        method: "btc_sendrawtransaction",
        params: [rawTxHex]
      });
      
      console.log(`🟡 [RESOLVE2] Transaction sent via Sandshrew!`);
      console.log(`🟡 [RESOLVE2] Sandshrew response:`, sandShrewResponse.data);

      const resultData = {
        txHash: sandShrewResponse.data.result,
        rawTx: rawTxHex,
        fee: totalFee,
        size: finalVSize,
        contract: `${BIDS_CONTRACT_BLOCK}:${BIDS_CONTRACT_TX}`,
        opcode: Number(RESOLVE_OPCODE),
        tokensUsed: tokenAmount > 0 ? `${tokenAmount} tokens (2:3)` : 'No tokens used'
      };

      setResult(resultData);
      return resultData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error(`🟡 [RESOLVE2] Resolve2 failed: ${errorMessage}`);
      if (err.response) {
        console.error(`🟡 [RESOLVE2] Response data:`, err.response.data);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    resolveContract2,
    loading,
    error,
    result
  };
}

export default useResolve2; 