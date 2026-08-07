import { Router } from 'express';
import { login } from '../controllers/authController';
import {
  getServices,
  getAvailability,
  createAppointment,
  listAppointments,
  cancelAppointment
} from '../controllers/appointmentController';
import { handleWhatsAppWebhook } from '../controllers/botController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/auth/login', login);
router.get('/services', getServices);
router.get('/availability', getAvailability);
router.post('/appointments', createAppointment);
router.post('/webhook/whatsapp', handleWhatsAppWebhook);
router.get('/appointments', authMiddleware, listAppointments);
router.patch('/appointments/:id/cancel', authMiddleware, cancelAppointment);

export default router;
