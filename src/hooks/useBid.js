/* global BigInt */
import { useState } from 'react';
import axios from 'axios';
import * as bitcoin from 'bitcoinjs-lib';

// Импорт alkanes библиотек
import { 
  encodeRunestoneProtostone, 
  ProtoStone, 
  encipher
} from 'alkanes/lib/index';

// Импорт из @oyl/sdk
import { mnemonicToAccount, getWalletPrivateKeys } from '@oyl/sdk/lib/account/account';
import { Provider } from '@oyl/sdk/lib/provider/provider';
import { Signer } from '@oyl/sdk/lib/signer/signer';
import * as utxo from '@oyl/sdk/lib/utxo/utxo';
import { findXAmountOfSats, getAddressType, formatInputsToSign } from '@oyl/sdk/lib/shared/utils';

export function useBid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const placeBid = async (param1, param2, param3, param4, tokenAmount = 0, feeRate = 2, manualUtxo = null) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const mnemonic = "jacket weapon ceiling stool vote consider banana depth daring trip pig sauce";
      
      // Настройка provider и account
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
      
      console.log(`💵 Total spendable balance: ${accountSpendableTotalBalance} sats`);
      console.log(`🧮 Number of UTXOs: ${accountSpendableTotalUtxos.length}`);

      // 🆕 НОВОЕ: использование ручного выбора UTXO
      let alkanesUtxos = [];
      if (tokenAmount > 0) {
        if (!manualUtxo) {
          throw new Error('Token amount specified but no manual UTXO provided. Please specify UTXO with txId:outputIndex');
        }
        
        console.log(`🎯 Using manually specified UTXO: ${manualUtxo.txId}:${manualUtxo.outputIndex}`);
        
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
        
        console.log(`📥 UTXO info:`, utxoResponse.data.result);
        
        const tokenUtxo = {
          txId: manualUtxo.txId,
          outputIndex: manualUtxo.outputIndex,
          satoshis: Math.round(utxoResponse.data.result.value * 100000000), // Convert BTC to sats
          address: "bcrt1pa3s736wjyesxn8sxr3nrwetk3ccz8qta5h3flnlnlj9rmecerknq64ncj3",
          scriptPk: utxoResponse.data.result.scriptPubKey.hex
        };
        
        alkanesUtxos.push(tokenUtxo);
        console.log(`✅ Using manual UTXO: ${tokenUtxo.txId}:${tokenUtxo.outputIndex} (${tokenUtxo.satoshis} sats)`);
      }

      // Создание protostone с правильным форматом calldata
      console.log(`🛠️ Creating protostone for Bids contract...`);
      console.log(`🪙 Token amount: ${tokenAmount} tokens (2:2)`);
      
      // Правильный формат calldata для контракта Bids
      const BIDS_CONTRACT_BLOCK = 4n;  // блок контракта Bids
      const BIDS_CONTRACT_TX = 122n;     // транзакция контракта Bids
      const PLACE_BET_OPCODE = 205n;   // opcode для place_bet
      const side = BigInt(param4);     // side: 0=DOWN, 1=UP
      
      console.log(`📋 Contract: ${BIDS_CONTRACT_BLOCK}:${BIDS_CONTRACT_TX}, Opcode: ${PLACE_BET_OPCODE}, Side: ${side}`);
      console.log(`🔗 Using SINGLE protostone with tokens AND calldata combined`);
      
      const calldata = encipher([
        BIDS_CONTRACT_BLOCK,  // блок контракта
        BIDS_CONTRACT_TX,     // транзакция контракта  
        PLACE_BET_OPCODE,     // opcode place_bet (110)
        side                  // side: 0=DOWN, 1=UP
      ]);

      // ✅ ПРАВИЛЬНАЯ ЛОГИКА: ОДИН протостоун с токенами И calldata
      const edicts = [];
      
      if (tokenAmount > 0) {
        const edict = {
          id: { block: 2n, tx: 3n },        // токен 2:3 (test)
          amount: BigInt(tokenAmount),       // количество токенов
          output: 0,                        // на output #0
        };
        edicts.push(edict);
        console.log(`💰 Created token edict:`, edict);
      }

      // ✅ ПРАВИЛЬНО: ОДИН протостоун с токенами И calldata
      const protostoneData = {
        protocolTag: 1n,
        edicts: tokenAmount > 0 ? edicts : [],  // ← токены (если есть)
        pointer: 0,
        refundPointer: 0,
        calldata,                              // ← calldata В ТОМ ЖЕ протостоуне!
      };
      
      console.log(`🎯 Final protostone structure:`, {
        hasEdicts: protostoneData.edicts.length > 0,
        hasCalldata: protostoneData.calldata.length > 0,
        edictCount: protostoneData.edicts.length
      });
      
      const protostone = encodeRunestoneProtostone({
        protostones: [ProtoStone.message(protostoneData)],
      }).encodedRunestone;

      const requiredAmount = 330;
      console.log(`💰 Required funds: ${requiredAmount} sats`);

      if (accountSpendableTotalBalance < requiredAmount) {
        throw new Error(`Insufficient funds! Required: ${requiredAmount} sats, available: ${accountSpendableTotalBalance} sats`);
      }

      // Оценка размера транзакции
      const initialUtxos = findXAmountOfSats(accountSpendableTotalUtxos, 330);
      let estimationPsbt = new bitcoin.Psbt({ network: provider.network });
      
      // Добавление inputs для оценки
      // 1️⃣ СНАЧАЛА добавляем alkane inputs  
      for (const utxo of alkanesUtxos) {
        console.log(`🏗️ Adding alkane input: ${utxo.txId}:${utxo.outputIndex}`);
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
      const totalFee = Math.ceil(vSize * feeRate);
      
      console.log(`📊 Estimated transaction size: ${vSize} vbytes`);
      console.log(`💸 Calculated fee: ${totalFee} sats`);
      
      const totalRequired = 330 + totalFee;

      // Создание финальной транзакции
      console.log(`🏗️ Building final transaction with correct fee...`);

      const gatheredUtxos = findXAmountOfSats(accountSpendableTotalUtxos, totalRequired);
      console.log(`💰 Gathered UTXOs for amount: ${gatheredUtxos.totalAmount} sats`);
      
      let finalPsbt = new bitcoin.Psbt({ network: provider.network });
      
      // Добавление inputs
      // 1️⃣ СНАЧАЛА добавляем alkane inputs
      for (const utxo of alkanesUtxos) {
        console.log(`🏗️ Adding alkane input to final PSBT: ${utxo.txId}:${utxo.outputIndex}`);
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
          console.log(`⏭️ Skipping duplicate UTXO: ${utxo.txId}:${utxo.outputIndex}`);
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
        console.log(`✅ Added change output: ${finalChangeAmount} sats`);
      } else {
        console.log(`⚠️ Change too small (${finalChangeAmount} sats), skipping`);
      }
      
      // Подписание финальной транзакции
      const formattedFinalPsbt = await formatInputsToSign({
        _psbt: finalPsbt,
        senderPublicKey: account.taproot.pubkey,
        network: provider.network,
      });
      
      console.log(`✍️ Signing final transaction...`);
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

      console.log(`✅ Transaction created successfully!`);
      console.log(`📊 Final transaction size: ${finalVSize} vbytes`);
      console.log(`💸 Final fee: ${totalFee} sats (${(totalFee/finalVSize).toFixed(2)} sats/vbyte)`);
      
      // Отправка транзакции
      const sandShrewResponse = await axios.post('http://localhost:18888', {
        jsonrpc: "2.0",
        id: 1,
        method: "btc_sendrawtransaction",
        params: [rawTxHex]
      });
      
      console.log(`✅ Transaction sent via Sandshrew!`);
      console.log(`📝 Sandshrew response:`, sandShrewResponse.data);

      const resultData = {
        txHash: sandShrewResponse.data.result,
        rawTx: rawTxHex,
        fee: totalFee,
        size: finalVSize,
        contract: `${BIDS_CONTRACT_BLOCK}:${BIDS_CONTRACT_TX}`,
        opcode: Number(PLACE_BET_OPCODE),
        side: side === 1n ? 'UP' : 'DOWN',
        tokenAmount,
        usedTokens: tokenAmount > 0,
        tokensUsed: tokenAmount > 0 ? `${tokenAmount} tokens (2:2)` : 'No tokens used'
      };

      setResult(resultData);
      return resultData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error(`❌ Bid placement error: ${errorMessage}`);
      if (err.response) {
        console.error(`Response data:`, err.response.data);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    placeBid,
    loading,
    error,
    result
  };
}

export default useBid; 