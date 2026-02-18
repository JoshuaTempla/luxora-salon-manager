import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
// import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
// router.use(authenticateToken);

// Get all payrolls
router.get('/', async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate, page, limit } = req.query;

    const where: any = {};

    if (employeeId) where.employeeId = employeeId as string;

    if (startDate && endDate) {
      where.payrollDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

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
          deductions: true,
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
        deductions: true,
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

// Calculate payroll preview (without saving)
// Also returns pending employee deductions so the form can display them
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
    end.setHours(23, 59, 59, 999);

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
        createdAt: { gte: start, lte: end },
      },
    });

    const commissionsEarned = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);

    // Get ALL pending deductions for this employee (not filtered by date —
    // deductions accumulate and are cleared on next payroll)
    const pendingDeductions = await prisma.employeeDeduction.findMany({
      where: {
        employeeId,
        isDeducted: false,
      },
      orderBy: { date: 'asc' },
    });

    const totalDeductionAmount = pendingDeductions.reduce((sum, d) => sum + d.amount, 0);

    // Calculate pay
    const hoursWorked = totalHoursWorked || 0;
    const hourlyPay = employee.hourlyRate * hoursWorked;
    const grossSalary = hourlyPay + commissionsEarned;

    // Tax (use provided rate or default to 0%)
    const taxPercentage = taxRate !== undefined ? taxRate : 0;
    const taxDeductions = (grossSalary * taxPercentage) / 100;

    // Net salary = gross - tax - employee deductions
    const netSalary = grossSalary - taxDeductions - totalDeductionAmount;

    return res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          hourlyRate: employee.hourlyRate,
        },
        period: { startDate: start, endDate: end },
        breakdown: {
          totalHoursWorked: hoursWorked,
          hourlyRate: employee.hourlyRate,
          hourlyPay,
          commissionsEarned,
          transactionCount: transactions.length,
          grossSalary,
          taxRate: taxPercentage,
          taxDeductions,
          // Deduction breakdown
          employeeDeductionAmount: totalDeductionAmount,
          employeeDeductionCount: pendingDeductions.length,
          pendingDeductions,
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

// Create new payroll
// After saving, marks all pending deductions as applied (isDeducted = true)
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

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Check for overlapping payroll periods
    const overlapping = await prisma.payroll.findFirst({
      where: {
        employeeId,
        OR: [
          { AND: [{ startDate: { lte: start } }, { endDate: { gte: start } }] },
          { AND: [{ startDate: { lte: end } }, { endDate: { gte: end } }] },
          { AND: [{ startDate: { gte: start } }, { endDate: { lte: end } }] },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        error: 'Payroll period overlaps with an existing payroll for this employee',
      });
    }

    // Get all pending deductions for this employee
    const pendingDeductions = await prisma.employeeDeduction.findMany({
      where: {
        employeeId,
        isDeducted: false,
      },
    });

    const totalDeductionAmount = pendingDeductions.reduce((sum, d) => sum + d.amount, 0);

    const hoursWorked = totalHoursWorked || 0;
    const commissions = commissionsEarned || 0;
    const hourlyPay = employee.hourlyRate * hoursWorked;
    const grossSalary = hourlyPay + commissions;
    const taxes = taxDeductions || 0;

    // Net = gross - tax - employee deductions
    const netSalary = grossSalary - taxes - totalDeductionAmount;

    // Create payroll and mark deductions in a transaction
    const payroll = await prisma.$transaction(async (tx) => {
      // Create the payroll record
      const newPayroll = await tx.payroll.create({
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

      // Mark all pending deductions as applied and link to this payroll
      if (pendingDeductions.length > 0) {
        await tx.employeeDeduction.updateMany({
          where: {
            id: { in: pendingDeductions.map((d) => d.id) },
          },
          data: {
            isDeducted: true,
            payrollId: newPayroll.id,
          },
        });
      }

      return newPayroll;
    });

    return res.status(201).json({
      success: true,
      data: payroll,
      message: `Payroll created successfully${pendingDeductions.length > 0 ? ` — ${pendingDeductions.length} deduction(s) of ₱${totalDeductionAmount.toFixed(2)} applied` : ''}`,
    });
  } catch (error) {
    console.error('Create payroll error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create payroll',
    });
  }
});

// Update payroll
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { totalHoursWorked, commissionsEarned, grossSalary, taxDeductions, netSalary } = req.body;

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

    if (totalHoursWorked !== undefined) updateData.totalHoursWorked = totalHoursWorked;
    if (commissionsEarned !== undefined) updateData.commissionsEarned = commissionsEarned;
    if (taxDeductions !== undefined) updateData.taxDeductions = taxDeductions;

    const hours = totalHoursWorked !== undefined ? totalHoursWorked : existingPayroll.totalHoursWorked;
    const commissions = commissionsEarned !== undefined ? commissionsEarned : existingPayroll.commissionsEarned;
    const taxes = taxDeductions !== undefined ? taxDeductions : existingPayroll.taxDeductions;

    const hourlyPay = existingPayroll.employee.hourlyRate * hours;
    updateData.grossSalary = hourlyPay + commissions;
    updateData.netSalary = updateData.grossSalary - taxes;

    if (grossSalary !== undefined) updateData.grossSalary = grossSalary;
    if (netSalary !== undefined) updateData.netSalary = netSalary;

    const payroll = await prisma.payroll.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        deductions: true,
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

    const existingPayroll = await prisma.payroll.findUnique({ where: { id } });

    if (!existingPayroll) {
      return res.status(404).json({
        success: false,
        error: 'Payroll not found',
      });
    }

    // Unlink any deductions tied to this payroll before deleting
    await prisma.employeeDeduction.updateMany({
      where: { payrollId: id },
      data: { isDeducted: false, payrollId: null },
    });

    await prisma.payroll.delete({ where: { id } });

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

export default router;