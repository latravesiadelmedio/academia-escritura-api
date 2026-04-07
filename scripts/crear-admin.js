require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function crearAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existe = await User.findOne({ email: 'gabrielacmerlo@gmail.com' });
  if (existe) {
    console.log('El usuario admin ya existe.');
    process.exit(0);
  }

  await User.create({
    name: 'Gabriela Merlo',
    email: 'gabrielacmerlo@gmail.com',
    password: 'admin123',
    isAdmin: true,
  });

  console.log('Admin creado correctamente.');
  process.exit(0);
}

crearAdmin().catch(err => {
  console.error(err.message);
  process.exit(1);
});
