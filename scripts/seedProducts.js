const path = require('path')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const connectDB = require('../src/config/db')
const Product = require('../src/models/Product')

const PLACEHOLDER_IMAGE_URL =
  'https://res.cloudinary.com/dkn3it92b/image/upload/v1773739331/inventory-products/xzlwq4g6r0gbgalme52k.png'

const rawProducts = [
  { name: 'Milk', price: 25, barcode: '100000001', expiryDate: '2026-12-31', category: 'Dairy' },
  { name: 'Bread', price: 30, barcode: '100000002', expiryDate: '2026-10-15', category: 'Bakery' },
  { name: 'Butter', price: 55, barcode: '100000003', expiryDate: '2026-11-20', category: 'Dairy' },
  { name: 'Eggs Pack', price: 70, barcode: '100000004', expiryDate: '2026-09-10', category: 'Poultry' },
  { name: 'Rice 1kg', price: 60, barcode: '100000005', expiryDate: '2027-05-01', category: 'Grains' },
  { name: 'Wheat Flour', price: 45, barcode: '100000006', expiryDate: '2027-03-15', category: 'Grains' },
  { name: 'Sugar', price: 40, barcode: '100000007', expiryDate: '2027-08-10', category: 'Groceries' },
  { name: 'Salt', price: 20, barcode: '100000008', expiryDate: '2028-01-01', category: 'Groceries' },
  { name: 'Cooking Oil', price: 150, barcode: '100000009', expiryDate: '2027-07-07', category: 'Groceries' },
  { name: 'Tomato Ketchup', price: 90, barcode: '100000010', expiryDate: '2026-12-01', category: 'Condiments' },
  { name: 'Green Tea', price: 120, barcode: '100000011', expiryDate: '2027-06-20', category: 'Beverages' },
  { name: 'Coffee Powder', price: 200, barcode: '100000012', expiryDate: '2027-04-25', category: 'Beverages' },
  { name: 'Biscuits Pack', price: 35, barcode: '100000013', expiryDate: '2026-08-18', category: 'Snacks' },
  { name: 'Chips', price: 20, barcode: '100000014', expiryDate: '2026-07-12', category: 'Snacks' },
  { name: 'Soap', price: 45, barcode: '100000015', expiryDate: '2028-09-30', category: 'Personal Care' },
  { name: 'Shampoo', price: 180, barcode: '100000016', expiryDate: '2028-02-14', category: 'Personal Care' },
  { name: 'Toothpaste', price: 95, barcode: '100000017', expiryDate: '2028-05-21', category: 'Personal Care' },
  { name: 'Detergent Powder', price: 220, barcode: '100000018', expiryDate: '2027-11-11', category: 'Household' },
  { name: 'Floor Cleaner', price: 130, barcode: '100000019', expiryDate: '2027-10-05', category: 'Household' },
  { name: 'Hand Sanitizer', price: 75, barcode: '100000020', expiryDate: '2027-09-09', category: 'Health' },
]

const run = async () => {
  try {
    await connectDB()

    const operations = rawProducts.map((product) => ({
      updateOne: {
        filter: { barcode: product.barcode },
        update: {
          $set: {
            name: product.name,
            price: product.price,
            barcode: product.barcode,
            expiryDate: new Date(product.expiryDate),
            category: product.category,
            imageUrl: PLACEHOLDER_IMAGE_URL,
          },
          $setOnInsert: {
            quantity: 0,
            lowStockThreshold: 10,
          },
        },
        upsert: true,
      },
    }))

    const result = await Product.bulkWrite(operations)
    const total = await Product.countDocuments()

    console.log('Seed complete')
    console.log(`Inserted: ${result.upsertedCount}`)
    console.log(`Updated: ${result.modifiedCount}`)
    console.log(`Total products in DB: ${total}`)
  } catch (error) {
    console.error('Seeding failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}

run()
