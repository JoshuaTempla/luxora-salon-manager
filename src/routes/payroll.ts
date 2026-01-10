import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all payrolls
router.get('/', async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate, page, limit } = req.query;

    const where: any = {};

    // Filter by employee if provided
    if (employeeId) {
      where.employeeId = employeeId as string;
    }

    // Filter by payroll date range if provided
    if (startDate && endDate) {
      where.payrollDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Pagination
    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { payrollDate: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              hourlyRate: true,
            },
          },
        },
      }),
      prisma.payroll.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: payrolls,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get payrolls error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payrolls',
    });
  }
});

// Get payroll by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        error: 'Payroll not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payroll',
    });
  }
});

// Create new payroll
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      startDate,
      endDate,
      totalHoursWorked,
      commissionsEarned,
      taxDeductions,
    } = req.body;

    // Validation
    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID, start date, and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date',
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

    // Check for overlapping payroll periods for this employee
    const overlapping = await prisma.payroll.findFirst({
      where: {
        employeeId,
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } },
            ],
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } },
            ],
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        error: 'Payroll period overlaps with existing payroll',
      });
    }

    // Calculate or use provided values
    const hoursWorked = totalHoursWorked || 0;
    const commissions = commissionsEarned || 0;

    // Calculate gross salary (hourly rate * hours + commissions)
    const hourlyPay = employee.hourlyRate * hoursWorked;
    const grossSalary = hourlyPay + commissions;

    // Calculate tax deductions (use provided or default to 0)
    const taxes = taxDeductions || 0;

    // Calculate net salary
    const netSalary = grossSalary - taxes;

    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        startDate: start,
        endDate: end,
        totalHoursWorked: hoursWorked,
        commissionsEarned: commissions,
        grossSalary,
        taxDeductions: taxes,
        netSalary,
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
      data: payroll,
      message: 'Payroll created successfully',
    });
  } catch (error) {
    console.error('Create payroll error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create payroll',
    });
  }
});

// Calculate payroll preview (without saving)
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate, totalHoursWorked, taxRate } = req.body;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID, start date, and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

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

    // Get commissions earned during this period
    const transactions = await prisma.transaction.findMany({
      where: {
        employeeId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const commissionsEarned = transactions.reduce(
      (sum, t) => sum + t.commissionAmount,
      0
    );

    // Calculate hours and pay
    const hoursWorked = totalHoursWorked || 0;
    const hourlyPay = employee.hourlyRate * hoursWorked;
    const grossSalary = hourlyPay + commissionsEarned;

    // Calculate tax (use provided rate or default to 10%)
    const taxPercentage = taxRate !== undefined ? taxRate : 10;
    const taxDeductions = (grossSalary * taxPercentage) / 100;
    const netSalary = grossSalary - taxDeductions;

    return res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          hourlyRate: employee.hourlyRate,
        },
        period: {
          startDate: start,
          endDate: end,
        },
        breakdown: {
          totalHoursWorked: hoursWorked,
          hourlyRate: employee.hourlyRate,
          hourlyPay,
          commissionsEarned,
          transactionCount: transactions.length,
          grossSalary,
          taxRate: taxPercentage,
          taxDeductions,
          netSalary,
        },
      },
    });
  } catch (error) {
    console.error('Calculate payroll preview error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate payroll preview',
    });
  }
});

// Update payroll
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      totalHoursWorked,
      commissionsEarned,
      grossSalary,
      taxDeductions,
      netSalary,
    } = req.body;

    // Check if payroll exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existingPayroll) {
      return res.status(404).json({
        success: false,
        error: 'Payroll not found',
      });
    }

    const updateData: any = {};

    if (totalHoursWorked !== undefined) {
      updateData.totalHoursWorked = totalHoursWorked;
    }
    if (commissionsEarned !== undefined) {
      updateData.commissionsEarned = commissionsEarned;
    }
    if (taxDeductions !== undefined) {
      updateData.taxDeductions = taxDeductions;
    }

    // Recalculate gross and net salary if values changed
    const hours = totalHoursWorked !== undefined ? totalHoursWorked : existingPayroll.totalHoursWorked;
    const commissions = commissionsEarned !== undefined ? commissionsEarned : existingPayroll.commissionsEarned;
    const taxes = taxDeductions !== undefined ? taxDeductions : existingPayroll.taxDeductions;

    const hourlyPay = existingPayroll.employee.hourlyRate * hours;
    updateData.grossSalary = hourlyPay + commissions;
    updateData.netSalary = updateData.grossSalary - taxes;

    // Allow manual override if explicitly provided
    if (grossSalary !== undefined) {
      updateData.grossSalary = grossSalary;
    }
    if (netSalary !== undefined) {
      updateData.netSalary = netSalary;
    }

    const payroll = await prisma.payroll.update({
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
      },
    });

    return res.status(200).json({
      success: true,
      data: payroll,
      message: 'Payroll updated successfully',
    });
  } catch (error) {
    console.error('Update payroll error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update payroll',
    });
  }
});

// Delete payroll
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if payroll exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id },
    });

    if (!existingPayroll) {
      return res.status(404).json({
        success: false,
        error: 'Payroll not found',
      });
    }

    await prisma.payroll.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Payroll deleted successfully',
    });
  } catch (error) {
    console.error('Delete payroll error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete payroll',
    });
  }
});

// Get payroll summary for an employee
router.get('/employee/:employeeId/summary', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

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

    const where: any = { employeeId };

    if (startDate && endDate) {
      where.payrollDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      orderBy: { payrollDate: 'desc' },
    });

    const totalPayrolls = payrolls.length;
    const totalHoursWorked = payrolls.reduce((sum, p) => sum + p.totalHoursWorked, 0);
    const totalCommissions = payrolls.reduce((sum, p) => sum + p.commissionsEarned, 0);
    const totalGrossSalary = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalTaxes = payrolls.reduce((sum, p) => sum + p.taxDeductions, 0);
    const totalNetSalary = payrolls.reduce((sum, p) => sum + p.netSalary, 0);

    const averageGrossSalary = totalPayrolls > 0 ? totalGrossSalary / totalPayrolls : 0;
    const averageNetSalary = totalPayrolls > 0 ? totalNetSalary / totalPayrolls : 0;

    return res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          position: employee.position,
          hourlyRate: employee.hourlyRate,
        },
        summary: {
          totalPayrolls,
          totalHoursWorked,
          totalCommissions,
          totalGrossSalary,
          totalTaxes,
          totalNetSalary,
          averageGrossSalary,
          averageNetSalary,
        },
        payrolls: payrolls.slice(0, 10), // Last 10 payrolls
      },
    });
  } catch (error) {
    console.error('Get payroll summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payroll summary',
    });
  }
});

export default router;