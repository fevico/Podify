import {Router} from 'express';
import { CreateUserSchema, EmailVerificationBody } from '#/utiles/validationSchema';
import { validate } from '#/middleware/validator';
import { create, sendReverificationToken, verifyEmail } from '#/controller/user';

const router = Router();

router.post('/create', validate(CreateUserSchema), create);
router.post('/verify-email', validate(EmailVerificationBody), verifyEmail);
router.post('/re-verify-email', sendReverificationToken);
router.post('/forget-password', generateForgetPasswordLink);
export default router 