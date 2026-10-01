const { Customer: CustomerModel, Location: LocationModel } = require('./src/infrastructure/database/sequelize/models');

(async () => {
  const customers = await CustomerModel.findAll({ order: [['id', 'DESC']], limit: 5 });
  for (const c of customers) {
    const locs = await LocationModel.count({ where: { customerId: c.id } });
    console.log(`Customer #${c.id} "${c.companyName}" address="${c.addressLine1}, ${c.city}" -> locations: ${locs}`);
  }
  process.exit(0);
})();
