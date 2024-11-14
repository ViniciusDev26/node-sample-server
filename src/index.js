import express, { json } from "express";
import { auth_routes } from "./routes/auth.js";
import { customer_routes } from "./routes/customer.js";

const app = express();

app.use(json());
app.use(customer_routes);
app.use(auth_routes);

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
