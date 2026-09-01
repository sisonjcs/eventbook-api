import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EventBook API",
      version: "1.0.0",
      description:
        "A backend event-booking API with concurrency-safe seat reservation.",
    },
    servers: [
      { url: "http://localhost:3000", description: "Local dev" },
      {
        url: "https://eventbook-api-il5s.onrender.com",
        description: "Production",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"], // where swagger-jsdoc looks for doc comments
};

export const swaggerSpec = swaggerJsdoc(options);
