import { randomUUID } from "crypto";
import { extname, resolve } from "path";
import { FastifyInstance } from "fastify";
import { createWriteStream, unlink } from "fs";

import { pipeline } from "stream";
import { promisify } from "util";

const pump = promisify(pipeline);

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/upload", async (request, reply) => {
    if (Number(request.headers["content-length"]) > 50_000_000) {
      return reply.status(400).send({
        message: "File size too big.",
      });
    }

    const upload = await request.file({
      limits: {
        fileSize: 50_000_000, // 50mb
      },
    });

    if (!upload) {
      return reply.status(400).send({ message: "No file provided" });
    }

    const mimeTypeRegex = /^(image|video)\/(png|jpe?g|gif|mp4|webm)$/;
    const isValidFileFormat = mimeTypeRegex.test(upload.mimetype);

    if (!isValidFileFormat) {
      return reply.status(400).send({ message: "Invalid file format" });
    }

    const fileId = randomUUID();
    const extension = extname(upload.filename);

    const fileName = `${fileId}${extension}`;

    const writeStream = createWriteStream(
      resolve(__dirname, "../../uploads/", fileName)
    );

    await pump(upload.file, writeStream);

    const fileUrl = `${request.protocol}://${request.hostname}/uploads/${fileName}`;
    console.log(fileUrl);
    return reply.status(201).send({ fileUrl });
  });

  app.delete("/upload/:fileName", (request, reply) => {
    const { fileName } = request.params as { fileName: string };

    const filePath = resolve(__dirname, "../../uploads/", fileName);

    unlink(filePath, (err) => {
      if (err) {
        throw err;
      }
    });

    return reply.status(204).send({ message: "File deleted successfully." });
  });
}
