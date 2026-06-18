import Transaction from '../models/Transaction.js';

export async function upsertTransaction({ sourceModel, sourceId, project, date, transactionType, description, moneyIn = 0, moneyOut = 0, paymentMode, notes }) {
  return Transaction.findOneAndUpdate(
    { sourceModel, sourceId },
    { sourceModel, sourceId, project, date, transactionType, description, moneyIn, moneyOut, paymentMode, notes },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function deleteTransaction(sourceModel, sourceId) {
  return Transaction.deleteOne({ sourceModel, sourceId });
}
