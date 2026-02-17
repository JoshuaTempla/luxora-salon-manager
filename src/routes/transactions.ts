import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
// router.use(authenticateToken);

// Get all transactions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { employeeId, serviceId, startDate, endDate, page, limit } = req.query;

    const where: any = {};

    // Filter by employee if provided
    if (employeeId) {
      where.employeeId = employeeId as string;
    }

    // Filter by service if provided
    if (serviceId) {
      where.serviceId = serviceId as string;
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Pagination
    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
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
              commissionRate: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
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
    const { employeeId, serviceId, soldPrice, customCommissionRate } = req.body;

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

    // Calculate price and commission
    const finalPrice = soldPrice !== undefined ? soldPrice : service.price;

    if (finalPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price cannot be negative',
      });
    }

    // Use custom commission rate if provided, otherwise use service rate, or employee base rate
    let commissionRate = service.commissionRate;
    if (customCommissionRate !== undefined) {
      if (customCommissionRate < 0 || customCommissionRate > 100) {
        return res.status(400).json({
          success: false,
          error: 'Commission rate must be between 0 and 100',
        });
      }
      commissionRate = customCommissionRate;
    } else if (service.commissionRate === 0 && employee.baseCommission > 0) {
      commissionRate = employee.baseCommission;
    }

    const commissionAmount = (finalPrice * commissionRate) / 100;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        employeeId,
        serviceId,
        soldPrice: finalPrice,
        commissionAmount,
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

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    // Validation
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
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
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

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    await prisma.transaction.delete({
      where: { id },
    });

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

// Get transaction summary/statistics
router.get('/summary/stats', async (req: Request, res: Response) => {
  try {
    const { employeeId, serviceId, startDate, endDate } = req.query;

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId as string;
    }

    if (serviceId) {
      where.serviceId = serviceId as string;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    const netRevenue = totalRevenue - totalCommissions;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Group by service
    const serviceBreakdown = transactions.reduce((acc: any, t) => {
      const serviceName = t.service.name;
      if (!acc[serviceName]) {
        acc[serviceName] = {
          count: 0,
          revenue: 0,
          commissions: 0,
        };
      }
      acc[serviceName].count++;
      acc[serviceName].revenue += t.soldPrice;
      acc[serviceName].commissions += t.commissionAmount;
      return acc;
    }, {});

    // Group by employee
    const employeeBreakdown = transactions.reduce((acc: any, t) => {
      const employeeName = `${t.employee.firstName} ${t.employee.lastName}`;
      if (!acc[employeeName]) {
        acc[employeeName] = {
          count: 0,
          revenue: 0,
          commissions: 0,
        };
      }
      acc[employeeName].count++;
      acc[employeeName].revenue += t.soldPrice;
      acc[employeeName].commissions += t.commissionAmount;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTransactions,
          totalRevenue,
          totalCommissions,
          netRevenue,
          averageTransaction,
        },
        byService: serviceBreakdown,
        byEmployee: employeeBreakdown,
      },
    });
  } catch (error) {
    console.error('Get transaction summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction summary',
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

    // Validate all transactions before creating any
    const validatedTransactions = [];
    
    for (const txn of transactions) {
      const { employeeId, serviceId, soldPrice, customCommissionRate } = txn;

      if (!employeeId || !serviceId) {
        return res.status(400).json({
          success: false,
          error: 'Each transaction must have employeeId and serviceId',
        });
      }

      // Fetch employee and service
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
      let commissionRate = service.commissionRate || employee.baseCommission;
      
      if (customCommissionRate !== undefined) {
        commissionRate = customCommissionRate;
      }

      const commissionAmount = (finalPrice * commissionRate) / 100;

      validatedTransactions.push({
        employeeId,
        serviceId,
        soldPrice: finalPrice,
        commissionAmount,
      });
    }

    // Create all transactions
    const created = await prisma.transaction.createMany({
      data: validatedTransactions,
    });

    return res.status(201).json({
      success: true,
      data: {
        count: created.count,
      },
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