import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all services
router.get('/', async (req: Request, res: Response) => {
  try {
    const { isActive, search, sortBy, sortOrder } = req.query;

    const where: any = {};

    // Filter by active status if provided
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Search by name if provided
    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    // Determine sorting
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.name = 'asc'; // Default sort by name
    }

    const services = await prisma.service.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Get services error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch services',
    });
  }
});

// Get service by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        transactions: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20, // Last 20 transactions
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Get service error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch service',
    });
  }
});

// Create new service
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, price, commissionRate, isActive } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Service name is required',
      });
    }

    if (price === undefined || price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a positive number',
      });
    }

    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Commission rate must be between 0 and 100',
      });
    }

    // Check if service name already exists
    const existingService = await prisma.service.findUnique({
      where: { name: name.trim() },
    });

    if (existingService) {
      return res.status(409).json({
        success: false,
        error: 'Service with this name already exists',
      });
    }

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        price,
        commissionRate: commissionRate || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully',
    });
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create service',
    });
  }
});

// Update service
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, commissionRate, isActive } = req.body;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    // Validation
    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a positive number',
      });
    }

    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Commission rate must be between 0 and 100',
      });
    }

    // Check if new name conflicts with another service
    if (name && name.trim() !== existingService.name) {
      const nameConflict = await prisma.service.findUnique({
        where: { name: name.trim() },
      });

      if (nameConflict) {
        return res.status(409).json({
          success: false,
          error: 'Service with this name already exists',
        });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = price;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (isActive !== undefined) updateData.isActive = isActive;

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: service,
      message: 'Service updated successfully',
    });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update service',
    });
  }
});

// Delete service (soft delete by setting isActive to false)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    // Warn if service has transactions
    if (existingService._count.transactions > 0 && permanent === 'true') {
      return res.status(400).json({
        success: false,
        error: `Cannot permanently delete service with ${existingService._count.transactions} transaction(s). Use soft delete instead.`,
      });
    }

    if (permanent === 'true') {
      // Permanent delete (only if no transactions)
      await prisma.service.delete({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: 'Service permanently deleted',
      });
    } else {
      // Soft delete
      const service = await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });

      return res.status(200).json({
        success: true,
        data: service,
        message: 'Service deactivated successfully',
      });
    }
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete service',
    });
  }
});

// Get service statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    // Build date filter
    const dateFilter: any = { serviceId: id };
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
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    const averagePrice = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Get top employees for this service
    const employeeStats = transactions.reduce((acc: any, t) => {
      const key = t.employeeId;
      if (!acc[key]) {
        acc[key] = {
          employee: t.employee,
          count: 0,
          revenue: 0,
          commissions: 0,
        };
      }
      acc[key].count++;
      acc[key].revenue += t.soldPrice;
      acc[key].commissions += t.commissionAmount;
      return acc;
    }, {});

    const topEmployees = Object.values(employeeStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        service: {
          id: service.id,
          name: service.name,
          currentPrice: service.price,
          commissionRate: service.commissionRate,
        },
        statistics: {
          totalTransactions,
          totalRevenue,
          totalCommissions,
          averagePrice,
          netRevenue: totalRevenue - totalCommissions,
        },
        topEmployees,
      },
    });
  } catch (error) {
    console.error('Get service stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch service statistics',
    });
  }
});

export default router;