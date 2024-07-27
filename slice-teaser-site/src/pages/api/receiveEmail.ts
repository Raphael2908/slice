import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type ResponseData = {
  message: string
}
const validateEmail = (email: string): RegExpMatchArray | null => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'POST') {
    console.log(validateEmail(req.body.email))
    if(validateEmail(req.body.email) == null){
      res.status(422).json({message: 'invalid email'})
      return
    }
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API}/sendMessage`, {
      'chat_id': process.env.TELEGRAM_CHAT_ID,
      'text': req.body.email
    })
    .then(()=> res.status(200).json({ message: 'email received' }))
    .catch(error => res.status(500).json({ message: 'internal server error' }))
    
  } else {
    // Handle any other HTTP method
    res.status(200).json({ message: 'Hello from slice!' })
  }
}