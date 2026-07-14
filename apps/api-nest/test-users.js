const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany().then(u => {
  console.log(u);
  p.$disconnect();
});
