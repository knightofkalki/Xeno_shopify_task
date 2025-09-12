const app = require('./src/app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('🎉 SERVER STARTED SUCCESSFULLY!');
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🗄️ Database: http://localhost:${PORT}/test-db`);
});
