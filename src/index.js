import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import express, { json } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "./config.js";
import { authJwt } from "./middlewares/auth-jwt.js";

const prisma = new PrismaClient();
const app = express();

app.use(json());

app.post("/customer", async (req, res) => {
	// Validate Request Body
	const body_schema = z.object({
		name: z.string(),
		email: z.string().email("Invalid email"),
		password: z.string().min(8, "Password must be at least 8 characters long"),
		phone: z.string().length(11, "Phone number must be 11 characters long"),
		address: z.string(),
	});
	const { data, success, error } = body_schema.safeParse(req.body);
	if (!success) return res.status(400).json({ error: error.errors });

	// Check if email is already in use
	const existing_customer = await prisma.customer.findUnique({
		where: { email: data.email },
	});
	if (existing_customer)
		return res.status(409).json({ error: "Email is already in use" });

	// Hash password and create customer
	const hashed_password = await bcrypt.hash(data.password, 10);
	const customer = await prisma.customer.create({
		data: {
			...data,
			password: hashed_password,
		},
	});

	res.json(customer);
});

app.get("/customer", authJwt, async (req, res) => {
	// no show customer password
	const customers = await prisma.customer.findMany({
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			address: true,
		},
	});

	res.json(customers);
});

app.delete("/customer/:id", async (req, res) => {
	const { id } = req.params;

	const customer = await prisma.customer.delete({
		where: { id },
	});

	res.json({ id: customer.id });
});

app.put("/customer/:id", async (req, res) => {
	const { id } = req.params;

	// Validate Request Body
	const body_schema = z.object({
		name: z.string(),
		email: z.string().email("Invalid email"),
		phone: z.string().length(11, "Phone number must be 11 characters long"),
		address: z.string(),
	});
	const { data, success, error } = body_schema.safeParse(req.body);
	if (!success) return res.status(400).json({ error: error.errors });

	const customer = await prisma.customer.update({
		where: { id },
		data,
	});

	res.json(customer);
});

app.post("/login", async (req, res) => {
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

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
