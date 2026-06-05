import { Request, Response } from 'express';
import Category from '../models/Category.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Get all categories
export const getCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = await Category.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: categories,
  });
});

// Get category by slug
export const getCategoryBySlug = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  }
);

// Create category (admin only)
export const createCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, description, icon, image } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Please provide a category name' });
      return;
    }

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      res.status(400).json({ success: false, message: 'Category already exists' });
      return;
    }

    const category = new Category({
      name,
      description,
      icon,
      image,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  }
);

// Update category (admin only)
export const updateCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    let category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  }
);

// Delete category (admin only)
export const deleteCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  }
);
