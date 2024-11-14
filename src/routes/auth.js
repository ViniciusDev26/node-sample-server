import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

export const auth_routes = Router();

auth_routes.post("/login", async (req, res) => {
	const { email, password } = req.body;

	const customer = await prisma.customer.findUnique({
		where: { email },
	});
	if (!customer) return res.status(404).json({ error: "Customer not found" });

	const password_match = await bcrypt.compare(password, customer.password);
	if (!password_match)
		return res.status(404).json({ error: "Customer not found" });

	const token = jwt.sign(
		{
			email: customer.email,
		},
		env.JWT_SECRET,
		{
			expiresIn: "1h",
			subject: String(customer.id),
		},
	);

	res.json({
		token,
	});
});
