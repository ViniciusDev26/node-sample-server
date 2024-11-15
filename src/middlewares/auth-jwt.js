import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authJwt(req, res, next) {
	const token_field = req.headers.authorization;
	if (!token_field) {
		return res.status(403).send({ message: "No token provided!" });
	}

	const [, token] = token_field.split(" ");

	jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
		if (err) {
			return res.status(401).send({ message: "Unauthorized!" });
		}
		req.userId = decoded.id;
		next();
	});
}
