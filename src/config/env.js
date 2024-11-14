import { z } from "zod";

const env_schema = z.object({
	JWT_SECRET: z.string(),
});

export const env = env_schema.parse(process.env);
