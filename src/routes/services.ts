import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

const VALID_COMMISSION_TYPES = ['PERCENTAGE', 'FIXED'];

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
          take: 20,
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
    const { name, price, commissionRate, commissionType, isActive } = req.body;

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

    const resolvedType: string = commissionType || 'PERCENTAGE';

    if (!VALID_COMMISSION_TYPES.includes(resolvedType)) {
      return res.status(400).json({
        success: false,
        error: 'commissionType must be PERCENTAGE or FIXED',
      });
    }

    if (commissionRate !== undefined && commissionRate < 0) {
      return res.status(400).json({
        success: false,
        error: 'Commission rate cannot be negative',
      });
    }

    // For PERCENTAGE, enforce 0-100 range
    if (resolvedType === 'PERCENTAGE' && commissionRate !== undefined && commissionRate > 100) {
      return res.status(400).json({
        success: false,
        error: 'Percentage commission must be between 0 and 100',
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
        commissionType: resolvedType,
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
    const { name, price, commissionRate, commissionType, isActive } = req.body;

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

    if (commissionType !== undefined && !VALID_COMMISSION_TYPES.includes(commissionType)) {
      return res.status(400).json({
        success: false,
        error: 'commissionType must be PERCENTAGE or FIXED',
      });
    }

    if (commissionRate !== undefined && commissionRate < 0) {
      return res.status(400).json({
        success: false,
        error: 'Commission rate cannot be negative',
      });
    }

    // For PERCENTAGE, enforce 0-100 range
    const resolvedType = commissionType || existingService.commissionType;
    if (resolvedType === 'PERCENTAGE' && commissionRate !== undefined && commissionRate > 100) {
      return res.status(400).json({
        success: false,
        error: 'Percentage commission must be between 0 and 100',
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
    if (commissionType !== undefined) updateData.commissionType = commissionType;
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

    if (existingService._count.transactions > 0 && permanent === 'true') {
      return res.status(400).json({
        success: false,
        error: `Cannot permanently delete service with ${existingService._count.transactions} transaction(s). Deactivate it instead.`,
      });
    }

    if (permanent === 'true') {
      await prisma.service.delete({ where: { id } });
      return res.status(200).json({
        success: true,
        message: 'Service permanently deleted',
      });
    } else {
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

export default router;