import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get overall business dashboard summary
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

    // Get transactions data
    const transactions = await prisma.transaction.findMany({
      where: dateFilter,
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

    const totalRevenue = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    const transactionCount = transactions.length;

    // Get expenses data
    const expenseFilter: any = {};
    if (startDate && endDate) {
      expenseFilter.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const expenses = await prisma.expense.findMany({
      where: expenseFilter,
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const fixedExpenses = expenses
      .filter(e => e.category === 'FIXED')
      .reduce((sum, e) => sum + e.amount, 0);
    const variableExpenses = expenses
      .filter(e => e.category === 'VARIABLE')
      .reduce((sum, e) => sum + e.amount, 0);

    // Calculate profit
    const grossProfit = totalRevenue - totalCommissions;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Get active employees count
    const activeEmployees = await prisma.employee.count({
      where: { isActive: true },
    });

    // Get active services count
    const activeServices = await prisma.service.count({
      where: { isActive: true },
    });

    // Top performing employees
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

    // Top services
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

// Get revenue trends over time
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

    // Group by day, week, or month
    const grouping = groupBy || 'day';
    const trends: any = {};

    transactions.forEach(t => {
      let key: string;
      const date = new Date(t.createdAt);

      if (grouping === 'month') {
        key = date.toISOString().substring(0, 7); // YYYY-MM
      } else if (grouping === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().substring(0, 10); // YYYY-MM-DD
      } else {
        key = date.toISOString().substring(0, 10); // YYYY-MM-DD
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

// Get employee performance comparison
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

    // Sort by revenue
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

// Get service performance analysis
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

    // Sort by revenue
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

// Get profit and loss statement
router.get('/profit-loss', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    // Revenue from transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);

    // Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      },
    });

    const fixedExpenses = expenses
      .filter(e => e.category === 'FIXED')
      .reduce((sum, e) => sum + e.amount, 0);
    const variableExpenses = expenses
      .filter(e => e.category === 'VARIABLE')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = fixedExpenses + variableExpenses;

    // Payroll data
    const payrolls = await prisma.payroll.findMany({
      where: {
        payrollDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      },
    });

    const totalPayroll = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);

    // Calculate profit
    const grossProfit = totalRevenue - totalCommissions;
    const totalCosts = totalExpenses + totalPayroll;
    const netProfit = grossProfit - totalCosts;

    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
        },
        revenue: {
          total: totalRevenue,
          transactionCount: transactions.length,
        },
        costs: {
          commissions: totalCommissions,
          expenses: {
            fixed: fixedExpenses,
            variable: variableExpenses,
            total: totalExpenses,
          },
          payroll: totalPayroll,
          total: totalCosts + totalCommissions,
        },
        profit: {
          gross: grossProfit,
          net: netProfit,
          grossMargin,
          profitMargin,
        },
      },
    });
  } catch (error) {
    console.error('Get profit and loss error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch profit and loss statement',
    });
  }
});

// Get cash flow analysis
router.get('/cash-flow', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const grouping = groupBy || 'month';

    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
    });

    // Get all expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: start, lte: end },
      },
    });

    // Get all payrolls
    const payrolls = await prisma.payroll.findMany({
      where: {
        payrollDate: { gte: start, lte: end },
      },
    });

    // Group data by period
    const cashFlow: any = {};

    const getKey = (date: Date) => {
      if (grouping === 'month') {
        return date.toISOString().substring(0, 7);
      } else if (grouping === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().substring(0, 10);
      } else {
        return date.toISOString().substring(0, 10);
      }
    };

    // Process transactions (cash inflow)
    transactions.forEach(t => {
      const key = getKey(new Date(t.createdAt));
      if (!cashFlow[key]) {
        cashFlow[key] = {
          period: key,
          inflow: 0,
          outflow: 0,
          net: 0,
        };
      }
      cashFlow[key].inflow += t.soldPrice;
    });

    // Process expenses (cash outflow)
    expenses.forEach(e => {
      const key = getKey(new Date(e.date));
      if (!cashFlow[key]) {
        cashFlow[key] = {
          period: key,
          inflow: 0,
          outflow: 0,
          net: 0,
        };
      }
      cashFlow[key].outflow += e.amount;
    });

    // Process payrolls (cash outflow)
    payrolls.forEach(p => {
      const key = getKey(new Date(p.payrollDate));
      if (!cashFlow[key]) {
        cashFlow[key] = {
          period: key,
          inflow: 0,
          outflow: 0,
          net: 0,
        };
      }
      cashFlow[key].outflow += p.netSalary;
    });

    // Calculate net cash flow
    Object.keys(cashFlow).forEach(key => {
      cashFlow[key].net = cashFlow[key].inflow - cashFlow[key].outflow;
    });

    const flowData = Object.values(cashFlow).sort((a: any, b: any) =>
      a.period.localeCompare(b.period)
    );

    // Calculate cumulative cash flow
    let cumulative = 0;
    const flowWithCumulative = flowData.map((item: any) => {
      cumulative += item.net;
      return {
        ...item,
        cumulative,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        groupBy: grouping,
        cashFlow: flowWithCumulative,
      },
    });
  } catch (error) {
    console.error('Get cash flow error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch cash flow analysis',
    });
  }
});

// Get key performance indicators (KPIs)
router.get('/kpis', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Transactions
    const transactions = await prisma.transaction.findMany({
      where: dateFilter,
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);

    // Expenses
    const expenseFilter: any = {};
    if (startDate && endDate) {
      expenseFilter.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const expenses = await prisma.expense.findMany({
      where: expenseFilter,
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Active resources
    const [activeEmployees, activeServices] = await Promise.all([
      prisma.employee.count({ where: { isActive: true } }),
      prisma.service.count({ where: { isActive: true } }),
    ]);

    // Calculate KPIs
    const averageRevenuePerTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;
    const averageRevenuePerEmployee = activeEmployees > 0 ? totalRevenue / activeEmployees : 0;
    const commissionRate = totalRevenue > 0 ? (totalCommissions / totalRevenue) * 100 : 0;
    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
    const netProfitMargin = totalRevenue > 0 ? ((totalRevenue - totalCommissions - totalExpenses) / totalRevenue) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          transactionCount: transactions.length,
          averagePerTransaction: averageRevenuePerTransaction,
          averagePerEmployee: averageRevenuePerEmployee,
        },
        costs: {
          commissions: totalCommissions,
          expenses: totalExpenses,
          commissionRate,
          expenseRatio,
        },
        efficiency: {
          netProfitMargin,
          revenuePerEmployee: averageRevenuePerEmployee,
        },
        resources: {
          activeEmployees,
          activeServices,
        },
      },
    });
  } catch (error) {
    console.error('Get KPIs error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch KPIs',
    });
  }
});

export default router;