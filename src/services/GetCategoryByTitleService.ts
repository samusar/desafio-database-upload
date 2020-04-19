import { getRepository } from 'typeorm';
import Category from '../models/Category';

class GetCategoryByTitleService {
  public async execute(title: string): Promise<Category> {
    const categoriesRepository = getRepository(Category);

    const categoryExisting = await categoriesRepository.findOne({
      where: { title },
    });

    if (categoryExisting) {
      return categoryExisting;
    }

    const category = categoriesRepository.create({ title });
    await categoriesRepository.save(category);
    return category;
  }
}

export default GetCategoryByTitleService;
