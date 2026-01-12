import { prisma } from '../lib/db';
import { hashPassword } from '../lib/auth';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create default admin user
    console.log('Creating admin user...');
    const hashedPassword = await hashPassword('admin123');
    
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created:', admin.username);

    // Create sample employees
    console.log('Creating sample employees...');
    const employees = await Promise.all([
      prisma.employee.upsert({
        where: { id: 'emp-1' },
        update: {},
        create: {
          id: 'emp-1',
          firstName: 'Maria',
          lastName: 'Santos',
          position: 'Senior Stylist',
          hourlyRate: 150,
          baseCommission: 15,
          isActive: true,
        },
      }),
      prisma.employee.upsert({
        where: { id: 'emp-2' },
        update: {},
        create: {
          id: 'emp-2',
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          position: 'Stylist',
          hourlyRate: 120,
          baseCommission: 12,
          isActive: true,
        },
      }),
      prisma.employee.upsert({
        where: { id: 'emp-3' },
        update: {},
        create: {
          id: 'emp-3',
          firstName: 'Ana',
          lastName: 'Garcia',
          position: 'Junior Stylist',
          hourlyRate: 100,
          baseCommission: 10,
          isActive: true,
        },
      }),
    ]);
    console.log(`✅ Created ${employees.length} employees`);

    // Create sample services
    console.log('Creating sample services...');
    const services = await Promise.all([
      prisma.service.upsert({
        where: { name: 'Haircut' },
        update: {},
        create: {
          name: 'Haircut',
          price: 300,
          commissionRate: 15,
          isActive: true,
        },
      }),
      prisma.service.upsert({
        where: { name: 'Hair Color' },
        update: {},
        create: {
          name: 'Hair Color',
          price: 1500,
          commissionRate: 20,
          isActive: true,
        },
      }),
      prisma.service.upsert({
        where: { name: 'Rebond' },
        update: {},
        create: {
          name: 'Rebond',
          price: 2500,
          commissionRate: 18,
          isActive: true,
        },
      }),
      prisma.service.upsert({
        where: { name: 'Hair Treatment' },
        update: {},
        create: {
          name: 'Hair Treatment',
          price: 800,
          commissionRate: 12,
          isActive: true,
        },
      }),
      prisma.service.upsert({
        where: { name: 'Blow Dry' },
        update: {},
        create: {
          name: 'Blow Dry',
          price: 200,
          commissionRate: 10,
          isActive: true,
        },
      }),
    ]);
    console.log(`✅ Created ${services.length} services`);

    // Create sample transactions
    console.log('Creating sample transactions...');
    const today = new Date();
    const transactions = [];

    for (let i = 0; i < 20; i++) {
      const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
      const randomService = services[Math.floor(Math.random() * services.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const transactionDate = new Date(today);
      transactionDate.setDate(today.getDate() - daysAgo);

      const commissionAmount = (randomService.price * randomService.commissionRate) / 100;

      transactions.push({
        employeeId: randomEmployee.id,
        serviceId: randomService.id,
        soldPrice: randomService.price,
        commissionAmount,
        createdAt: transactionDate,
      });
    }

    await prisma.transaction.createMany({
      data: transactions,
    });
    console.log(`✅ Created ${transactions.length} sample transactions`);

    // Create sample expenses
    console.log('Creating sample expenses...');
    const expenses = [
      {
        description: 'Rent',
        amount: 15000,
        category: 'FIXED' as const,
        isRecurring: true,
      },
      {
        description: 'Utilities (Water & Electricity)',
        amount: 3500,
        category: 'FIXED' as const,
        isRecurring: true,
      },
      {
        description: 'Hair Products Inventory',
        amount: 8000,
        category: 'VARIABLE' as const,
        isRecurring: false,
      },
      {
        description: 'Marketing & Advertising',
        amount: 2000,
        category: 'VARIABLE' as const,
        isRecurring: true,
      },
      {
        description: 'Equipment Maintenance',
        amount: 1500,
        category: 'VARIABLE' as const,
        isRecurring: false,
      },
    ];

    await prisma.expense.createMany({
      data: expenses,
    });
    console.log(`✅ Created ${expenses.length} sample expenses`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n⚠️  Remember to change the admin password in production!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });