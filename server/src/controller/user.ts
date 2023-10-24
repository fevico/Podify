
import { CreateUser, verifyEmailRequest } from "#/@types/user";
import { RequestHandler } from "express";
import User from '#/models/user';
import { generateToken } from "#/utiles/helper";
import { sendVerificationMail } from "#/utiles/mail";
import EmailVerificationToken from "#/models/emailVerificationToken";
import { isValidObjectId } from "mongoose";


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

res.status(201).json({user: {id: user._id, name, email}});

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
    await EmailVerificationToken.findByIdAndDelete(verificationToken._id)
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

    }