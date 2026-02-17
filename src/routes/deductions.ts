import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
// import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
// router.use(authenticateToken);

const VALID_TYPES = ['CASH_ADVANCE', 'EQUIPMENT', 'PENALTY', 'OTHER'];

// Get all deductions with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { employeeId, isDeducted, type, startDate, endDate } = req.query;

    const where: any = {};

    if (employeeId) where.employeeId = employeeId as string;
    if (isDeducted !== undefined) where.isDeducted = isDeducted === 'true';
    if (type) where.type = type as string;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const deductions = await prisma.employeeDeduction.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: deductions,
    });
  } catch (error) {
    console.error('Get deductions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch deductions',
    });
  }
});

// Get pending deductions total for a specific employee
router.get('/pending/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const deductions = await prisma.employeeDeduction.findMany({
      where: {
        employeeId,
        isDeducted: false,
      },
      orderBy: { date: 'asc' },
    });

    const total = deductions.reduce((sum, d) => sum + d.amount, 0);

    return res.status(200).json({
      success: true,
      data: {
        total,
        count: deductions.length,
        deductions,
      },
    });
  } catch (error) {
    console.error('Get pending deductions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch pending deductions',
    });
  }
});

// Get single deduction by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deduction = await prisma.employeeDeduction.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
    });

    if (!deduction) {
      return res.status(404).json({
        success: false,
        error: 'Deduction not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: deduction,
    });
  } catch (error) {
    console.error('Get deduction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch deduction',
    });
  }
});

// Create new deduction
router.post('/', async (req: Request, res: Response) => {
  try {
    const { employeeId, type, description, amount, date } = req.body;

    if (!employeeId || !type || !description || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'employeeId, type, description, and amount are required',
      });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `type must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    const deduction = await prisma.employeeDeduction.create({
      data: {
        employeeId,
        type,
        description: description.trim(),
        amount,
        date: date ? new Date(date) : new Date(),
        isDeducted: false,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: deduction,
      message: 'Deduction created successfully',
    });
  } catch (error) {
    console.error('Create deduction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create deduction',
    });
  }
});

// Update deduction (only if not yet deducted)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, description, amount, date } = req.body;

    const existing = await prisma.employeeDeduction.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Deduction not found',
      });
    }

    if (existing.isDeducted) {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit a deduction that has already been applied to a payroll',
      });
    }

    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `type must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description.trim();
    if (amount !== undefined) updateData.amount = amount;
    if (date !== undefined) updateData.date = new Date(date);

    const deduction = await prisma.employeeDeduction.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: deduction,
      message: 'Deduction updated successfully',
    });
  } catch (error) {
    console.error('Update deduction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update deduction',
    });
  }
});

// Delete deduction (only if not yet deducted)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.employeeDeduction.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Deduction not found',
      });
    }

    if (existing.isDeducted) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a deduction that has already been applied to a payroll',
      });
    }

    await prisma.employeeDeduction.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Deduction deleted successfully',
    });
  } catch (error) {
    console.error('Delete deduction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete deduction',
    });
  }
});

export default router;