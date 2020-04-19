import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';

import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const transactionExisting = await transactionsRepository.findOne(id);

    if (!transactionExisting) {
      throw new AppError('Transaction does not exist.');
    }

    await transactionsRepository.remove(transactionExisting);
  }
}

export default DeleteTransactionService;
