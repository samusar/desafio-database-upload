import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Category from '../models/Category';

import Transaction from '../models/Transaction';

import uplaodConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  public async execute(name_file: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const fileDir = path.join(uplaodConfig.directory, name_file);
    const file = fs.createReadStream(fileDir, 'utf8');

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = file.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    // Verificando qual das categorias existem no banco
    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    // Pegando apenas os titulos que existem no banco
    const existentCategoriesTitle = existentCategories.map(
      category => category.title,
    );

    // Pegando os titulos das categorias que não estão no banco de dados.
    const addCategoryTitles = categories.filter(
      category => !existentCategoriesTitle.includes(category),
    );

    // Limpando duplicatas
    const uniqueAddCategoryTitles = addCategoryTitles.filter(
      (value, index, self) => self.indexOf(value) === index,
    );

    const newsCategories = categoriesRepository.create(
      uniqueAddCategoryTitles.map(title => ({ title })),
    );

    await categoriesRepository.save(newsCategories);

    const allCategories = [...newsCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(fileDir);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
