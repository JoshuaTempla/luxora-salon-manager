import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ═══════════════════════════════════════════════════════════════════════════
// EXISTING ENDPOINTS (for dashboard)
// ═══════════════════════════════════════════════════════════════════════════

// GET /analytics/dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: dateFilter,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        service: {
          select: { id: true, name: true },
        },
      },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    const transactionCount = transactions.length;

    const expenseFilter: any = {};
    if (startDate && endDate) {
      expenseFilter.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const expenses = await prisma.expense.findMany({ where: expenseFilter });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const fixedExpenses = expenses.filter(e => e.category === 'FIXED').reduce((sum, e) => sum + e.amount, 0);
    const variableExpenses = expenses.filter(e => e.category === 'VARIABLE').reduce((sum, e) => sum + e.amount, 0);

    const grossProfit = totalRevenue - totalCommissions;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const activeEmployees = await prisma.employee.count({ where: { isActive: true } });
    const activeServices = await prisma.service.count({ where: { isActive: true } });

    const employeePerformance = transactions.reduce((acc: any, t) => {
      const key = t.employeeId;
      if (!acc[key]) {
        acc[key] = {
          employee: t.employee,
          transactionCount: 0,
          totalRevenue: 0,
          totalCommissions: 0,
        };
      }
      acc[key].transactionCount++;
      acc[key].totalRevenue += t.soldPrice;
      acc[key].totalCommissions += t.commissionAmount;
      return acc;
    }, {});

    const topEmployees = Object.values(employeePerformance)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    const servicePerformance = transactions.reduce((acc: any, t) => {
      const key = t.serviceId;
      if (!acc[key]) {
        acc[key] = {
          service: t.service,
          count: 0,
          revenue: 0,
        };
      }
      acc[key].count++;
      acc[key].revenue += t.soldPrice;
      return acc;
    }, {});

    const topServices = Object.values(servicePerformance)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalExpenses,
          totalCommissions,
          grossProfit,
          netProfit,
          profitMargin,
          transactionCount,
          averageTransaction: transactionCount > 0 ? totalRevenue / transactionCount : 0,
        },
        resources: {
          activeEmployees,
          activeServices,
        },
        expenses: {
          total: totalExpenses,
          fixed: fixedExpenses,
          variable: variableExpenses,
        },
        topPerformers: {
          employees: topEmployees,
          services: topServices,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
    });
  }
});

// GET /analytics/revenue-trends
router.get('/revenue-trends', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const grouping = groupBy || 'day';
    const trends: any = {};

    transactions.forEach(t => {
      let key: string;
      const date = new Date(t.createdAt);

      if (grouping === 'month') {
        key = date.toISOString().substring(0, 7);
      } else if (grouping === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().substring(0, 10);
      } else {
        key = date.toISOString().substring(0, 10);
      }

      if (!trends[key]) {
        trends[key] = {
          period: key,
          revenue: 0,
          commissions: 0,
          transactions: 0,
        };
      }

      trends[key].revenue += t.soldPrice;
      trends[key].commissions += t.commissionAmount;
      trends[key].transactions++;
    });

    const trendData = Object.values(trends).sort((a: any, b: any) =>
      a.period.localeCompare(b.period)
    );

    return res.status(200).json({
      success: true,
      data: {
        groupBy: grouping,
        trends: trendData,
      },
    });
  } catch (error) {
    console.error('Get revenue trends error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue trends',
    });
  }
});

// GET /analytics/employee-comparison
router.get('/employee-comparison', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        transactions: {
          where: dateFilter,
        },
      },
    });

    const comparison = employees.map(emp => {
      const transactions = emp.transactions;
      const revenue = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
      const commissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);

      return {
        employee: {
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          position: emp.position,
          hourlyRate: emp.hourlyRate,
        },
        performance: {
          transactionCount: transactions.length,
          totalRevenue: revenue,
          totalCommissions: commissions,
          averageTransaction: transactions.length > 0 ? revenue / transactions.length : 0,
          commissionRate: revenue > 0 ? (commissions / revenue) * 100 : 0,
        },
      };
    });

    comparison.sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue);

    return res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Get employee comparison error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch employee comparison',
    });
  }
});

// GET /analytics/service-performance
router.get('/service-performance', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        transactions: {
          where: dateFilter,
        },
      },
    });

    const performance = services.map(svc => {
      const transactions = svc.transactions;
      const revenue = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
      const commissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);

      return {
        service: {
          id: svc.id,
          name: svc.name,
          price: svc.price,
          commissionRate: svc.commissionRate,
        },
        performance: {
          transactionCount: transactions.length,
          totalRevenue: revenue,
          totalCommissions: commissions,
          netRevenue: revenue - commissions,
          averagePrice: transactions.length > 0 ? revenue / transactions.length : 0,
        },
      };
    });

    performance.sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue);

    return res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Get service performance error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch service performance',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// NEW ENDPOINTS (for cutoff-based sales analytics)
// ═══════════════════════════════════════════════════════════════════════════

// Helper: Get gross sales for a period
async function calculateGrossSales(startDate: Date, endDate: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const grossSales = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
  const transactionCount = transactions.length;
  const averageTransactionValue = transactionCount > 0 ? grossSales / transactionCount : 0;

  return { grossSales, transactionCount, averageTransactionValue };
}

// Helper: Get business expenses for a period
async function calculateBusinessExpenses(startDate: Date, endDate: Date) {
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

// Helper: Get total gross salaries for a period
async function calculateTotalGrossSalaries(startDate: Date, endDate: Date) {
  const payrolls = await prisma.payroll.findMany({
    where: {
      startDate: { gte: startDate },
      endDate: { lte: endDate },
    },
  });

  return payrolls.reduce((sum, p) => sum + p.grossSalary, 0);
}

// GET /analytics/gross-sales?startDate=...&endDate=...
router.get('/gross-sales', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const { grossSales, transactionCount, averageTransactionValue } = await calculateGrossSales(start, end);

    return res.status(200).json({
      success: true,
      data: {
        period: `${startDate} to ${endDate}`,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        grossSales,
        transactionCount,
        averageTransactionValue,
      },
    });
  } catch (error) {
    console.error('Get gross sales error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch gross sales',
    });
  }
});

// GET /analytics/net-sales?startDate=...&endDate=...
router.get('/net-sales', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const { grossSales } = await calculateGrossSales(start, end);
    const businessExpenses = await calculateBusinessExpenses(start, end);
    const totalGrossSalaries = await calculateTotalGrossSalaries(start, end);

    const netSales = grossSales - businessExpenses - totalGrossSalaries;

    return res.status(200).json({
      success: true,
      data: {
        period: `${startDate} to ${endDate}`,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        grossSales,
        businessExpenses,
        totalGrossSalaries,
        netSales,
      },
    });
  } catch (error) {
    console.error('Get net sales error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch net sales',
    });
  }
});

// GET /analytics/monthly-cutoffs?year=2024&month=2
router.get('/monthly-cutoffs', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'year and month are required',
      });
    }

    const y = parseInt(year as string);
    const m = parseInt(month as string);

    const firstStart = new Date(y, m - 1, 1);
    const firstEnd = new Date(y, m - 1, 15, 23, 59, 59, 999);
    const secondStart = new Date(y, m - 1, 16);
    const secondEnd = new Date(y, m, 0, 23, 59, 59, 999);
    const fullStart = new Date(y, m - 1, 1);
    const fullEnd = new Date(y, m, 0, 23, 59, 59, 999);

    const [firstCutoff, secondCutoff, fullMonth] = await Promise.all([
      calculateGrossSales(firstStart, firstEnd),
      calculateGrossSales(secondStart, secondEnd),
      calculateGrossSales(fullStart, fullEnd),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        firstCutoff: {
          period: `${y}-${String(m).padStart(2, '0')}-01 to ${y}-${String(m).padStart(2, '0')}-15`,
          startDate: firstStart.toISOString(),
          endDate: firstEnd.toISOString(),
          ...firstCutoff,
        },
        secondCutoff: {
          period: `${y}-${String(m).padStart(2, '0')}-16 to ${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`,
          startDate: secondStart.toISOString(),
          endDate: secondEnd.toISOString(),
          ...secondCutoff,
        },
        fullMonth: {
          period: `${y}-${String(m).padStart(2, '0')} (Full Month)`,
          startDate: fullStart.toISOString(),
          endDate: fullEnd.toISOString(),
          ...fullMonth,
        },
      },
    });
  } catch (error) {
    console.error('Get monthly cutoffs error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly cutoffs',
    });
  }
});

// GET /analytics/monthly-net-sales?year=2024&month=2
router.get('/monthly-net-sales', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'year and month are required',
      });
    }

    const y = parseInt(year as string);
    const m = parseInt(month as string);

    const firstStart = new Date(y, m - 1, 1);
    const firstEnd = new Date(y, m - 1, 15, 23, 59, 59, 999);
    const secondStart = new Date(y, m - 1, 16);
    const secondEnd = new Date(y, m, 0, 23, 59, 59, 999);
    const fullStart = new Date(y, m - 1, 1);
    const fullEnd = new Date(y, m, 0, 23, 59, 59, 999);

    const firstGross = await calculateGrossSales(firstStart, firstEnd);
    const firstExpenses = await calculateBusinessExpenses(firstStart, firstEnd);
    const firstSalaries = await calculateTotalGrossSalaries(firstStart, firstEnd);

    const secondGross = await calculateGrossSales(secondStart, secondEnd);
    const secondExpenses = await calculateBusinessExpenses(secondStart, secondEnd);
    const secondSalaries = await calculateTotalGrossSalaries(secondStart, secondEnd);

    const fullGross = await calculateGrossSales(fullStart, fullEnd);
    const fullExpenses = await calculateBusinessExpenses(fullStart, fullEnd);
    const fullSalaries = await calculateTotalGrossSalaries(fullStart, fullEnd);

    return res.status(200).json({
      success: true,
      data: {
        firstCutoff: {
          period: `${y}-${String(m).padStart(2, '0')}-01 to ${y}-${String(m).padStart(2, '0')}-15`,
          startDate: firstStart.toISOString(),
          endDate: firstEnd.toISOString(),
          grossSales: firstGross.grossSales,
          businessExpenses: firstExpenses,
          totalGrossSalaries: firstSalaries,
          netSales: firstGross.grossSales - firstExpenses - firstSalaries,
        },
        secondCutoff: {
          period: `${y}-${String(m).padStart(2, '0')}-16 to ${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`,
          startDate: secondStart.toISOString(),
          endDate: secondEnd.toISOString(),
          grossSales: secondGross.grossSales,
          businessExpenses: secondExpenses,
          totalGrossSalaries: secondSalaries,
          netSales: secondGross.grossSales - secondExpenses - secondSalaries,
        },
        fullMonth: {
          period: `${y}-${String(m).padStart(2, '0')} (Full Month)`,
          startDate: fullStart.toISOString(),
          endDate: fullEnd.toISOString(),
          grossSales: fullGross.grossSales,
          businessExpenses: fullExpenses,
          totalGrossSalaries: fullSalaries,
          netSales: fullGross.grossSales - fullExpenses - fullSalaries,
        },
      },
    });
  } catch (error) {
    console.error('Get monthly net sales error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly net sales',
    });
  }
});

export default router;