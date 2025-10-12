import type { NextApiRequest, NextApiResponse } from "next";
import { insertOne, findOne } from "../../../../lib/helpers";
import { Account, User } from "../../../../lib/types";
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { employeeID, password, role } = req.body;

        if (!employeeID || !password || !role ) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Create
        const passwordHash = await bcrypt.hash(password, 10);

        const existingAccount = await findOne<Account>('accounts', {employeeID});
       
        if(existingAccount){
            res.status(400).json({ message: "Employee already exists" });
            return;
        }

        const newAccount = await insertOne<Account>('accounts', { employeeID, passwordHash, role });

        const accountId = newAccount.insertedId.toString();

        // Create a linked user and the user must provide this values on the first loggin
         const newUser = await insertOne<User>('users', {
            accountId,
            name: "",
            email: "",
            mobile: "",
            DOB: null,
            allergies: [],
            RH: '',
            employeeID: employeeID,
            role: role
        });

        res.status(200).json({ account: newAccount, user: newUser });

    } catch (error: unknown) {
        if (error instanceof Error) {
            return res.status(500).json({ message: error.message });
        }
        return res.status(500).json({ message: "Unknown server error" });
    }
}
