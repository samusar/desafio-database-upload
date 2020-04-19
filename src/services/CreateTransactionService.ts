import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

import GetCategoryByTitleService from './GetCategoryByTitleService';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_title: string;
}

class CreateTransactionService {
  public async execute({
    category_title,
    type,
    title,
    value,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError('Balance insufient.');
    }

    const getCategoryByTitle = new GetCategoryByTitleService();

    const category = await getCategoryByTitle.execute(category_title);

    const transaction = transactionsRepository.create({
      title,
      value,
      category,
      type,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
