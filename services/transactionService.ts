import { firestore } from "@/config/firebase";
import { ResponseType, TransactionType, WalletType } from "@/types";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";
import { createOrUpdateWallet } from "./walletService";

export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
  try {
    const { id, type, amount, walletId, image } = transactionData;
    if (!amount || amount <= 0 || !walletId || !type) {
      return { success: true, msg: "Invalid transaction data" };
    }

    if (id) {
      // Update Existing Transaction
      const oldTransactionSnapshot = await getDoc(
        doc(firestore, "transactions", id)
      );
      const oldTransaction = oldTransactionSnapshot.data() as TransactionType;
      const shouldRevertOriginal =
        oldTransaction.type !== type ||
        oldTransaction.amount !== amount ||
        oldTransaction.walletId !== walletId;
      if (shouldRevertOriginal) {
        let res = await revertAndUpdateNewWallets(
          oldTransaction,
          Number(amount),
          type,
          walletId
        );
        if (!res.success) {
          return { success: false, msg: res.msg };
        }
      }
    } else {
      // New Transaction
      let res = await updateWalletForNewTransaction(
        walletId,
        Number(amount!),
        type
      );
      if (!res.success) {
        return res;
      }
    }
    if (image) {
      const imageUploadRes = await uploadFileToCloudinary(
        image,
        "transactions"
      );
      if (!imageUploadRes) {
        return {
          success: false,
          msg: imageUploadRes || "Failed to upload recipt",
        };
      }
      transactionData.image = imageUploadRes.data;
    }

    const transactionRef = id
      ? doc(firestore, "transactions", id)
      : doc(collection(firestore, "transactions"));

    await setDoc(transactionRef, transactionData, { merge: true });

    return {
      success: true,
      data: { ...transactionData, id: transactionRef.id },
    };
    //To do: Delete all transactions
  } catch (error: any) {
    console.log("Error creating or updating transaction", error);
    return { success: false, msg: error.message };
  }
};

const updateWalletForNewTransaction = async (
  walletId: string,
  amount: number,
  type: string
) => {
  try {
    const walletRef = doc(firestore, "wallets", walletId);
    const walletSnapShot = await getDoc(walletRef);
    if (!walletSnapShot.exists()) {
      console.log("Error updated wallet for new transaction");
      return { success: false, msg: "Wallet not found" };
    }

    const walletData = walletSnapShot.data() as WalletType;

    if (type === "expense" && walletData.amount! - amount < 0) {
      return {
        success: false,
        msg: "Selected wallet has unsufficient balance for this transaction",
      };
    }

    const updateType = type === "income" ? "totalIncome" : "totalExpenses";
    const updatedWalletAmount =
      type === "income"
        ? Number(walletData.amount) + amount
        : Number(walletData.amount) - amount;

    const updatedTotals =
      type === "income"
        ? Number(walletData.totalIncome) + amount
        : Number(walletData.totalExpenses) + amount;

    await updateDoc(walletRef, {
      amount: updatedWalletAmount,
      [updateType]: updatedTotals,
    });
    return { success: true };
  } catch (error: any) {
    console.log("Error updated wallet for new transaction", error);
    return { success: false, msg: error.message };
  }
};

const revertAndUpdateNewWallets = async (
  oldTransaction: TransactionType,
  newTrasnactionAmount: number,
  newTransactionType: string,
  newWalletId: string
) => {
  try {
    const originalWalletSnapshot = await getDoc(
      doc(firestore, "wallets", oldTransaction.walletId)
    );

    const originalWallet = originalWalletSnapshot.data() as WalletType;

    let newWalletSnapshot = await getDoc(
      doc(firestore, "wallets", newWalletId)
    );

    let newWallet = newWalletSnapshot.data() as WalletType;

    const revertType =
      oldTransaction.type === "income" ? "totalIncome" : "totalExpenses";

    const revertIncomeExpense: number =
      oldTransaction.type === "income"
        ? -Number(oldTransaction.amount)
        : Number(oldTransaction.amount);

    const revertedWalletAmount =
      Number(originalWallet.amount) + revertIncomeExpense;

    const revertedIncomeExpenseAmount =
      Number(originalWallet[revertType]) - Number(oldTransaction.amount);

    if (newTransactionType == "expense") {
      // if user tries to convert income to expense on the same wallet
      // or if user tries to add expense which is more than the wallet amount
      if (
        oldTransaction.walletId == newWalletId &&
        revertedWalletAmount < newTrasnactionAmount
      ) {
        return {
          success: false,
          msg: "The selected wallet don't have enough balance",
        };
      }

      if (newWallet.amount! < newTrasnactionAmount) {
        return {
          sucess: false,
          msg: "The selected wallet don't have enough balance",
        };
      }
    }

    await createOrUpdateWallet({
      id: oldTransaction.walletId,
      amount: revertedWalletAmount,
      [revertType]: revertedIncomeExpenseAmount,
    });

    //////////////////////////////////////////////////////////////////////////

    newWalletSnapshot = await getDoc(doc(firestore, "wallets", newWalletId));

    newWallet = newWalletSnapshot.data() as WalletType;

    const updateType =
      newTransactionType === "income" ? "totalIncome" : "totalExpenses";

    const updatedTransactionAmount: number =
      newTransactionType === "income"
        ? Number(newTrasnactionAmount)
        : -Number(newTrasnactionAmount);
    const newWalletAmount = Number(newWallet.amount) + updatedTransactionAmount;

    const newIncomeExpenseAmount = Number(
      newWallet[updateType]! + Number(newTrasnactionAmount)
    );

    await createOrUpdateWallet({
      id: newWalletId,
      amount: newWalletAmount,
      [updateType]: newIncomeExpenseAmount,
    });

    return { success: true };
  } catch (error: any) {
    console.log("Error updated wallet for new transaction", error);
    return { success: false, msg: error.message };
  }
};

export const deleteTransaction = async (
  transactionId: string,
  walletId: string
): Promise<ResponseType> => {
  try {
    const transactionRef = doc(firestore, "transactions", transactionId);
    const transactionSnapshot = await getDoc(transactionRef);
    if (!transactionSnapshot.exists()) {
      return { success: false, msg: "Transaction not found" };
    }
    const transactionData = transactionSnapshot.data() as TransactionType;

    const transactionType = transactionData?.type;
    const transactionAmount = transactionData?.amount;

    //fetch wallet
    const WalletSnapshot = await getDoc(doc(firestore, "wallets", walletId));

    const walletData = WalletSnapshot.data() as WalletType;

    const updateType =
      transactionType === "income" ? "totalIncome" : "totalExpenses";

    const newWalletAmount =
      walletData?.amount! -
      (transactionType === "income" ? transactionAmount : -transactionAmount);

    const newIncomeExpenseAmount = walletData[updateType]! - transactionAmount;

    // if its expense and the wallet amount can go below zero
    if (transactionType === "expense" && newWalletAmount < 0) {
      return { success: false, msg: "You cannot delete this transaction" };
    }

    await createOrUpdateWallet({
      id: walletId,
      amount: newWalletAmount,
      [updateType]: newIncomeExpenseAmount,
    });

    await deleteDoc(transactionRef);
    return { success: true };
  } catch (error: any) {
    console.log("Error deleting transaction", error);
    return { success: false, msg: error.message };
  }
};
