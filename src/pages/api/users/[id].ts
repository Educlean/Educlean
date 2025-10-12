import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { findById, updateOne } from '../../../../lib/helpers';
import type { User } from '../../../../lib/types';

export default async function handler (
    req: NextApiRequest,
    res: NextApiResponse
)
    {
        const rawId = req.query.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;

        if(!id) {
            return res.status(400).json({ message: 'Invalid ID'});
        }
        if(!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ObjectId' });
        }

        if(req.method === 'GET') {
            const user = await findById<User>("users", id);
            if(!user) return res.status(404).json({ message: 'User not found' });
        
            return res.status(200).json(user);
        }

        if(req.method === 'PATCH') {
            const body = req.body as {
                name?: string;
                email?: string;
                mobile?: string;
                DOB?: string;
                allergies?: string;
                RH?: string;
            };

            const updateDoc: Partial<User> = {};
            if(body.name) updateDoc.name = body.name;
            if(body.email) updateDoc.email = body.email;
            if(body.mobile) updateDoc.mobile = body.mobile;
            if(body.DOB) {
                const date = new Date(body.DOB);
                if(!isNaN(date.getTime())) {
                    updateDoc.DOB = date;
                }
            }
            if(body.RH) updateDoc.RH = body.RH;
            if(body.allergies) {
                if (Array.isArray(body.allergies)) {
                    updateDoc.allergies = body.allergies;
                } else if (typeof body.allergies === 'string') {
                    updateDoc.allergies = body.allergies
                    .split(/[ ,]+/)
                    .map((a: string) => a.trim())
                    .filter(Boolean);
                }
            }

            const result = await updateOne<User>("users", id, updateDoc);
            return res.status(200).json(result);

        }
        res.setHeader("Allow", ["GET", "PATCH"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`)

}    
