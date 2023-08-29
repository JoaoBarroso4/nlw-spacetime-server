import { randomUUID } from "crypto";
import { extname, resolve } from "path";
import { FastifyInstance } from "fastify";
import { createWriteStream } from "fs";

import { pipeline } from "stream";
import { promisify } from "util";

const pump = promisify(pipeline);

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/upload", async (request, reply) => {
    const upload = await request.file({
      limits: {
        fileSize: 5_242_880, // 5mb
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

    return { fileUrl };
  });
}
