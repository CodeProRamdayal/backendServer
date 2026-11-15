import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { sequelize } from './src/database/config';
import './src/database/models';
import { errorHandler } from './src/common/errors';
import roleRoutes from './src/roles/routes/roleRoutes';
import salaryRoutes from './src/salaryManagement/routes/salaryRoutes';
import userRoutes from './src/users/routes/userRoutes';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : false
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/salary', salaryRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
app.use(errorHandler);

const port = Number(process.env.PORT || 4000);
if (require.main === module) {
  sequelize.authenticate()
    .then(() => app.listen(port, () => console.log(`Salary Management API listening on port ${`http://localhost:${port}`}.`)))
    .catch((error: unknown) => {
      console.error('Unable to connect to the database:', error);
      process.exitCode = 1;
    });
}

export default app;