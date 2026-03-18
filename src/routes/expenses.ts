import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all expenses
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, isRecurring, startDate, endDate, page, limit, sortBy, sortOrder } = req.query;

    const where: any = {};

    // Filter by category if provided
    if (category) {
      where.category = category as string;
    }

    // Filter by recurring status if provided
    if (isRecurring !== undefined) {
      where.isRecurring = isRecurring === 'true';
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Pagination
    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.date = 'desc'; // Default sort by date
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
      }),
      prisma.expense.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses',
    });
  }
});

// Get expense by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Get expense error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch expense',
    });
  }
});

// Create new expense
router.post('/', async (req: Request, res: Response) => {
  try {
    const { description, amount, category, date, isRecurring } = req.body;

    // Validation
    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Description is required',
      });
    }

    if (amount === undefined || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    if (!category || !['FIXED', 'VARIABLE'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Category must be either FIXED or VARIABLE',
      });
    }

    const expense = await prisma.expense.create({
      data: {
        description: description.trim(),
        amount,
        category,
        date: date ? new Date(date) : new Date(),
        isRecurring: isRecurring || false,
      },
    });

    return res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully',
    });
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create expense',
    });
  }
});

// Update expense
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, amount, category, date, isRecurring } = req.body;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
      });
    }

    // Validation
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    if (category && !['FIXED', 'VARIABLE'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Category must be either FIXED or VARIABLE',
      });
    }

    const updateData: any = {};
    if (description !== undefined) updateData.description = description.trim();
    if (amount !== undefined) updateData.amount = amount;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = new Date(date);
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: expense,
      message: 'Expense updated successfully',
    });
  } catch (error) {
    console.error('Update expense error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update expense',
    });
  }
});

// Delete expense
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
      });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete expense',
    });
  }
});

// Get expense summary/statistics
router.get('/summary/stats', async (req: Request, res: Response) => {
  try {
    const { category, startDate, endDate, isRecurring } = req.query;

    const where: any = {};

    if (category) {
      where.category = category as string;
    }

    if (isRecurring !== undefined) {
      where.isRecurring = isRecurring === 'true';
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const fixedExpenses = expenses
      .filter(e => e.category === 'FIXED')
      .reduce((sum, e) => sum + e.amount, 0);
    const variableExpenses = expenses
      .filter(e => e.category === 'VARIABLE')
      .reduce((sum, e) => sum + e.amount, 0);
    const recurringExpenses = expenses
      .filter(e => e.isRecurring)
      .reduce((sum, e) => sum + e.amount, 0);
    const oneTimeExpenses = expenses
      .filter(e => !e.isRecurring)
      .reduce((sum, e) => sum + e.amount, 0);

    const expenseCount = expenses.length;
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    // Group by category
    const byCategory = {
      FIXED: {
        count: expenses.filter(e => e.category === 'FIXED').length,
        total: fixedExpenses,
      },
      VARIABLE: {
        count: expenses.filter(e => e.category === 'VARIABLE').length,
        total: variableExpenses,
      },
    };

    // Top 10 largest expenses
    const topExpenses = expenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Monthly breakdown if date range is provided
    let monthlyBreakdown = null;
    if (startDate && endDate) {
      const monthlyMap = expenses.reduce((acc: any, e) => {
        const month = new Date(e.date).toISOString().substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = {
            month,
            total: 0,
            count: 0,
            fixed: 0,
            variable: 0,
          };
        }
        acc[month].total += e.amount;
        acc[month].count++;
        if (e.category === 'FIXED') {
          acc[month].fixed += e.amount;
        } else {
          acc[month].variable += e.amount;
        }
        return acc;
      }, {});

      monthlyBreakdown = Object.values(monthlyMap).sort((a: any, b: any) => 
        a.month.localeCompare(b.month)
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalExpenses,
          fixedExpenses,
          variableExpenses,
          recurringExpenses,
          oneTimeExpenses,
          expenseCount,
          averageExpense,
        },
        byCategory,
        topExpenses,
        monthlyBreakdown,
      },
    });
  } catch (error) {
    console.error('Get expense summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch expense summary',
    });
  }
});

// Bulk create expenses
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Expenses array is required and cannot be empty',
      });
    }

    // Validate all expenses before creating any
    const validatedExpenses = [];

    for (const exp of expenses) {
      const { description, amount, category, date, isRecurring } = exp;

      if (!description || description.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'All expenses must have a description',
        });
      }

      if (amount === undefined || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'All expenses must have an amount greater than 0',
        });
      }

      if (!category || !['FIXED', 'VARIABLE'].includes(category)) {
        return res.status(400).json({
          success: false,
          error: 'All expenses must have a valid category (FIXED or VARIABLE)',
        });
      }

      validatedExpenses.push({
        description: description.trim(),
        amount,
        category,
        date: date ? new Date(date) : new Date(),
        isRecurring: isRecurring || false,
      });
    }

    // Create all expenses
    const created = await prisma.expense.createMany({
      data: validatedExpenses,
    });

    return res.status(201).json({
      success: true,
      data: {
        count: created.count,
      },
      message: `${created.count} expenses created successfully`,
    });
  } catch (error) {
    console.error('Bulk create expenses error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create expenses',
    });
  }
});

// Get recurring expenses
router.get('/recurring/list', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = {
      isRecurring: true,
    };

    if (category) {
      where.category = category as string;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { amount: 'desc' },
    });

    const totalRecurring = expenses.reduce((sum, e) => sum + e.amount, 0);

    return res.status(200).json({
      success: true,
      data: {
        expenses,
        summary: {
          count: expenses.length,
          totalMonthly: totalRecurring,
          totalAnnual: totalRecurring * 12,
        },
      },
    });
  } catch (error) {
    console.error('Get recurring expenses error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch recurring expenses',
    });
  }
});

export default router;