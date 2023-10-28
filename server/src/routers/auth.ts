import {Router} from 'express';
import { CreateUserSchema, SignInValidationSchema, TokenAndIDValidation, UpdatePasswordSchema } from '#/utiles/validationSchema';
import { validate } from '#/middleware/validator';
import { create, generateForgetPasswordLink, grantValid, sendReverificationToken, signIn, updatePassword, verifyEmail } from '#/controller/user';
import { isValidPasswordResetToken, mustAuth } from '#/middleware/auth';
import { JwtPayload, verify } from 'jsonwebtoken';
import User from '#/models/user';

const router = Router();

router.post('/create', validate(CreateUserSchema), create);
router.post('/verify-email', validate(TokenAndIDValidation), verifyEmail);
router.post('/re-verify-email', sendReverificationToken);
router.post('/forget-password', generateForgetPasswordLink);
router.post('/verify-pass-reset-token', validate(TokenAndIDValidation), isValidPasswordResetToken, grantValid);
router.post('/update-password', validate(UpdatePasswordSchema), isValidPasswordResetToken,  updatePassword);
router.post('/sign-in', validate(SignInValidationSchema), signIn);

router.get('/is-auth', mustAuth, (req, res) =>{
    res.json({
        profile: req.user,
    });
})  
router.get('/public', mustAuth, (req, res) =>{
    res.json({
        message: "You are in public route"
    });
})  
router.get('/private', mustAuth, (req, res) =>{
    res.json({
        message: "You are in private route"
    });
})  

    
export default router      