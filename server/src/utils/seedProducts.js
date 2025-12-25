const { faker } = require('@faker-js/faker');

const generateProducts = (count = 20) => {
  const products = [];

  for (let i = 0; i < count; i++) {
    products.push({
      name: faker.commerce.productName(),
      slug: faker.helpers.slugify(faker.commerce.productName()),
      type: faker.helpers.arrayElement(['game', 'peripheral']),
      price: Number(faker.commerce.price()),
      category: {
        id: 'cat_general',
        name: 'General'
      },
      stock: {
        total: faker.number.int({ min: 0, max: 100 })
      },
      metadata: {
        createdAt: new Date().toISOString()
      }
    });
  }

  return products;
};

module.exports = generateProducts;
