import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './src/routes';
import { startReminderCron } from './src/services/reminderService';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(routes);

// Inicializa a rotina de lembretes
startReminderCron();

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
