import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all employees
router.get('/', async (req: Request, res: Response) => {
  try {
    const { isActive, search } = req.query;

    const where: any = {};

    // Filter by active status if provided
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Search by name if provided
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { position: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true, payrolls: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Get employees error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch employees',
    });
  }
});

// Get employee by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        transactions: {
          include: {
            service: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 transactions
        },
        payrolls: {
          orderBy: { payrollDate: 'desc' },
          take: 5, // Last 5 payrolls
        },
        _count: {
          select: { transactions: true, payrolls: true },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Get employee error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch employee',
    });
  }
});

// Create new employee
router.post('/', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, position, hourlyRate, baseCommission, isActive } = req.body;

    // Validation
    if (!firstName || !lastName || !position) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and position are required',
      });
    }

    if (hourlyRate !== undefined && hourlyRate < 0) {
      return res.status(400).json({
        success: false,
        error: 'Hourly rate cannot be negative',
      });
    }

    if (baseCommission !== undefined && (baseCommission < 0 || baseCommission > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Base commission must be between 0 and 100',
      });
    }

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        position,
        hourlyRate: hourlyRate || 0,
        baseCommission: baseCommission || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully',
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create employee',
    });
  }
});

// Update employee
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, position, hourlyRate, baseCommission, isActive } = req.body;

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Validation
    if (hourlyRate !== undefined && hourlyRate < 0) {
      return res.status(400).json({
        success: false,
        error: 'Hourly rate cannot be negative',
      });
    }

    if (baseCommission !== undefined && (baseCommission < 0 || baseCommission > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Base commission must be between 0 and 100',
      });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (position !== undefined) updateData.position = position;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (baseCommission !== undefined) updateData.baseCommission = baseCommission;
    if (isActive !== undefined) updateData.isActive = isActive;

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: employee,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update employee',
    });
  }
});

// Delete employee (soft delete by setting isActive to false)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    if (permanent === 'true') {
      // Permanent delete (use with caution)
      await prisma.employee.delete({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: 'Employee permanently deleted',
      });
    } else {
      // Soft delete
      const employee = await prisma.employee.update({
        where: { id },
        data: { isActive: false },
      });

      return res.status(200).json({
        success: true,
        data: employee,
        message: 'Employee deactivated successfully',
      });
    }
  } catch (error) {
    console.error('Delete employee error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete employee',
    });
  }
});

// Get employee statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Build date filter
    const dateFilter: any = { employeeId: id };
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Get transaction statistics
    const transactions = await prisma.transaction.findMany({
      where: dateFilter,
      include: {
        service: true,
      },
    });

    const totalTransactions = transactions.length;
    const totalSales = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Get payroll statistics
    const payrollFilter: any = { employeeId: id };
    if (startDate && endDate) {
      payrollFilter.payrollDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const payrolls = await prisma.payroll.findMany({
      where: payrollFilter,
    });

    const totalPayrolls = payrolls.length;
    const totalGrossSalary = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalNetSalary = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const totalHoursWorked = payrolls.reduce((sum, p) => sum + p.totalHoursWorked, 0);

    return res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          position: employee.position,
        },
        transactions: {
          total: totalTransactions,
          totalSales,
          totalCommissions,
          averageTransaction,
        },
        payroll: {
          total: totalPayrolls,
          totalGrossSalary,
          totalNetSalary,
          totalHoursWorked,
        },
      },
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch employee statistics',
    });
  }
});

export default router;