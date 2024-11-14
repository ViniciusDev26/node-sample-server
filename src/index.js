const { PrismaClient } = require("@prisma/client");
const express = require("express");
const { z } = require("zod");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

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

app.get("/customer", async (req, res) => {
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

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
