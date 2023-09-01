import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function memoriesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await request.jwtVerify();
  });

  app.get("/memories", async (request) => {
    const { beginDate, endDate } = request.query as {
      beginDate?: string;
      endDate?: string;
    };
    const memories = await prisma.memory.findMany({
      where: { userId: request.user.sub },
      orderBy: { createdAt: "asc" },
    });

    if (beginDate && endDate) {
      const beginDateTimestamp = new Date(beginDate).getTime();
      const endDateTimestamp = new Date(endDate).getTime();

      return memories.filter((memory) => {
        const memoryDateTimestamp = new Date(memory.createdAt).getTime();
        return (
          memoryDateTimestamp >= beginDateTimestamp &&
          memoryDateTimestamp <= endDateTimestamp
        );
      });
    }

    return memories.map((memory) => {
      return {
        id: memory.id,
        coverUrl: memory.coverUrl,
        content:
          memory.content.length > 115
            ? memory.content.substring(0, 115).concat("...")
            : memory.content,
        isPublic: memory.isPublic,
        createdAt: memory.createdAt,
      };
    });
  });

  app.get("/memories/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const memory = await prisma.memory.findUniqueOrThrow({ where: { id } });

    if (!memory.isPublic && memory.userId !== request.user.sub) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    return memory;
  });

  app.post("/memories", async (request, reply) => {
    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string().url(),
      isPublic: z.coerce.boolean().default(false),
    });

    const { content, coverUrl, isPublic } = bodySchema.parse(request.body);

    const memory = await prisma.memory.create({
      data: { content, coverUrl, isPublic, userId: request.user.sub },
    });

    return reply.status(201).send(memory);
  });

  app.put("/memories/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
    const { id } = paramsSchema.parse(request.params);

    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string().url(),
      isPublic: z.coerce.boolean().default(false),
    });
    const { content, coverUrl, isPublic } = bodySchema.parse(request.body);

    let memory = await prisma.memory.findUniqueOrThrow({ where: { id } });

    if (memory.userId !== request.user.sub) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    memory = await prisma.memory.update({
      where: { id },
      data: { content, coverUrl, isPublic },
    });

    return memory;
  });

  app.delete("/memories/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const memory = await prisma.memory.findUniqueOrThrow({ where: { id } });

    if (memory.userId !== request.user.sub) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    await prisma.memory.delete({ where: { id } });

    return reply.status(204).send();
  });
}
