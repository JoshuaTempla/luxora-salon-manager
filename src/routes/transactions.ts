import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
// import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
// router.use(authenticateToken);

// Helper: calculate commission based on type
function calculateCommission(
  price: number,
  commissionRate: number,
  commissionType: string
): number {
  if (commissionType === 'FIXED') {
    return commissionRate; // flat amount, ignores price
  }
  return (price * commissionRate) / 100; // percentage of price
}

// Get all transactions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, employeeId, serviceId, limit, offset } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (employeeId) where.employeeId = employeeId as string;
    if (serviceId) where.serviceId = serviceId as string;

    const transactions = await prisma.transaction.findMany({
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
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            commissionType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
    });
  }
});

// Get transaction by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        employee: true,
        service: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction',
    });
  }
});

// Create new transaction
router.post('/', async (req: Request, res: Response) => {
  try {
    const { employeeId, serviceId, soldPrice, date } = req.body;

    // Validation
    if (!employeeId || !serviceId) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID and Service ID are required',
      });
    }

    // Verify employee exists and is active
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    if (!employee.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Employee is not active',
      });
    }

    // Verify service exists and is active
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    if (!service.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Service is not active',
      });
    }

    const finalPrice = soldPrice !== undefined ? soldPrice : service.price;

    if (finalPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price cannot be negative',
      });
    }

    // Calculate commission based on service's commissionType
    const commissionAmount = calculateCommission(
      finalPrice,
      service.commissionRate,
      service.commissionType
    );

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
      employeeId,
      serviceId,
      soldPrice: finalPrice,
      commissionAmount,
      ...(date ? { createdAt: new Date(date) } : {}),
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
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            commissionType: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully',
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create transaction',
    });
  }
});

// Update transaction
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { soldPrice, commissionAmount } = req.body;

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    if (soldPrice !== undefined && soldPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price cannot be negative',
      });
    }

    if (commissionAmount !== undefined && commissionAmount < 0) {
      return res.status(400).json({
        success: false,
        error: 'Commission amount cannot be negative',
      });
    }

    const updateData: any = {};
    if (soldPrice !== undefined) updateData.soldPrice = soldPrice;
    if (commissionAmount !== undefined) updateData.commissionAmount = commissionAmount;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        service: {
          select: { id: true, name: true, commissionType: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update transaction',
    });
  }
});

// Delete transaction
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    await prisma.transaction.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete transaction',
    });
  }
});

// Bulk create transactions
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transactions array is required and cannot be empty',
      });
    }

    const validatedTransactions = [];

    for (const txn of transactions) {
      const { employeeId, serviceId, soldPrice, date } = txn;

      if (!employeeId || !serviceId) {
        return res.status(400).json({
          success: false,
          error: 'Each transaction must have employeeId and serviceId',
        });
      }

      const [employee, service] = await Promise.all([
        prisma.employee.findUnique({ where: { id: employeeId } }),
        prisma.service.findUnique({ where: { id: serviceId } }),
      ]);

      if (!employee || !employee.isActive) {
        return res.status(400).json({
          success: false,
          error: `Invalid or inactive employee: ${employeeId}`,
        });
      }

      if (!service || !service.isActive) {
        return res.status(400).json({
          success: false,
          error: `Invalid or inactive service: ${serviceId}`,
        });
      }

      const finalPrice = soldPrice !== undefined ? soldPrice : service.price;
      const commissionAmount = calculateCommission(
        finalPrice,
        service.commissionRate,
        service.commissionType
      );

      validatedTransactions.push({
        employeeId,
        serviceId,
        soldPrice: finalPrice,
        commissionAmount,
      });
    }

    const created = await prisma.transaction.createMany({
      data: validatedTransactions,
    });

    return res.status(201).json({
      success: true,
      data: { count: created.count },
      message: `${created.count} transactions created successfully`,
    });
  } catch (error) {
    console.error('Bulk create transactions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create transactions',
    });
  }
});

export default router;