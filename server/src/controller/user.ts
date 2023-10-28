
import { CreateUser, verifyEmailRequest } from "#/@types/user";
import jwt from "jsonwebtoken";
import { RequestHandler } from "express";
import User from '#/models/user';
import { generateToken } from "#/utiles/helper";
import { sendForgetPasswordLink, sendPassResetSuccessEmail, sendVerificationMail } from "#/utiles/mail";
import EmailVerificationToken from "#/models/emailVerificationToken";
import PasswordResetToken from "#/models/passwordResetToken";
import { isValidObjectId } from "mongoose";
import crypto from "crypto";
import { JWT_SECRET, PASSWORD_RESET_LINK } from "#/utiles/variables";
import passwordResetToken from "#/models/passwordResetToken";


export const create: RequestHandler = async(req: CreateUser, res)=>{
   
const {email, password, name} = req.body;

const user = await User.create({name, email, password}); 
// send verification email 
const token = generateToken()

await EmailVerificationToken.create({
  owner: user._id, 
  token 
})
sendVerificationMail(token, {name, email, userId: user._id.toString() })

res.status(201).json({user: {id: user._id, name, email} });

}

export const verifyEmail: RequestHandler = async(req: verifyEmailRequest, res)=>{
   
  const {token, userId} = req.body;

  const verificationToken = await EmailVerificationToken.findOne({
      owner: userId
  })

  if(!verificationToken) res.status(403).json({error: "Invalid Token!"});
    
    const matched = await verificationToken?.compareToken(token)
    if(!matched) res.status(403).json({error: "Invalid Token!"});

    await User.findByIdAndUpdate(userId, {
      verified: true
    });
    await EmailVerificationToken.findByIdAndDelete(verificationToken?._id)
    res.json({message: "Your email is verified"});

}

export const sendReverificationToken: RequestHandler = async(req, res)=>{
   
    const { userId } = req.body;

    if(!isValidObjectId(userId)) return res.status(403).json({error: "Invalid request!"})

    const user = await User.findById(userId)
    if(!user) return res.status(403).json({error: "Invalid request!"})

   await EmailVerificationToken.findOneAndDelete({
      owner: userId
    })

    const token = generateToken();

    await EmailVerificationToken.create({
      owner: userId,
      token
    })

   sendVerificationMail(token, {
    name: user?.name,
    email: user?.email,
    userId: user?._id.toString()
   })
   res.json({message: "Please check your mail."})
}

export const generateForgetPasswordLink: RequestHandler = async(req, res)=>{
   
    const { email } = req.body;

   const user = await User.findOne({email})
   if(!user) return res.status(404).json({error: "Account not found!"})

  //  generate the link if the email exist 
  await PasswordResetToken.findOneAndDelete({
    owner: user._id,
  })

const token = crypto.randomBytes(36).toString('hex')

  await PasswordResetToken.create({
    owner: user._id,
    token,
  })

  const resetLink = `${PASSWORD_RESET_LINK}?token=${token}&userId=${user._id}`

  sendForgetPasswordLink({ email:user.email, link:resetLink });

  res.json({ message: "Check your registered mail" });
    }

export const isValidPasswordResetToken: RequestHandler = async(req, res)=>{
    const { token, userId } = req.body;

   const resetToken = await PasswordResetToken.findOne({owner: userId})
   if(!resetToken) return res.status(403).json({error: "Unauthorized acccess, invalid token"});

   const matched = await resetToken.compareToken(token)
   if(!matched) return res.status(403).json({error: "Unauthorized acccess, invalid token"});
  
   res.json({ message: "your token is valid."})
}

export const grantValid: RequestHandler = async(req, res)=>{
   res.json({valid: true});
}

export const updatePassword: RequestHandler = async(req, res)=>{
  const {password, userId} =req.body
  const user = await User.findById(userId)
  if(!user) return res.status(403).json({error: "Unathorized access!"}) 

  const matched = await user.comparePassword(password)
  if(matched) return res.status(422).json({error: "The new password must be diffrent!"})

  user.password = password
  await user.save()

  await PasswordResetToken.findOneAndDelete({owner: user._id});
  // send success mail
  sendPassResetSuccessEmail(user.name, user.email) 
  res.json({message: "Password Reset successfully."})
};

export const signIn: RequestHandler = async (req, res) => {
  const { password, email } = req.body;

  const user = await User.findOne({
    email,
  });
  if (!user) return res.status(403).json({ error: "Email/Password mismatch!" });

  // compare the password
  const matched = await user.comparePassword(password);
  if (!matched)
    return res.status(403).json({ error: "Email/Password mismatch!" });

  // generate the token for later use.
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  user.tokens.push(token);

  await user.save();

  res.json({
    profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avater?.url,
      followers: user.followers.length,
      followings: user.followings.length,
    },
    token,
  });
};

