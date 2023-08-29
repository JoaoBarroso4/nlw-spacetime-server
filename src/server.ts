import "dotenv/config";

import fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { memoriesRoutes } from "./routes/memories";
import { authRoutes } from "./routes/auth";
import { uploadRoutes } from "./routes/upload";
import { resolve } from "path";

const app = fastify();

const PORT = 3333;

app.register(multipart);

// eslint-disable-next-line @typescript-eslint/no-var-requires
app.register(require("@fastify/static"), {
  root: resolve(__dirname, "../uploads"),
  prefix: "/uploads/",
});

app.register(cors, {
  origin: true,
});

app.register(jwt, {
  secret: "secret", //process.env.JWT_SECRET
});

app.register(authRoutes);
app.register(uploadRoutes);
app.register(memoriesRoutes);

app
  .listen({ port: PORT })
  .then(() => console.log("Server listening on port " + PORT));
