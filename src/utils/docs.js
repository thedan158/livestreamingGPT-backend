import swaggerJsDoc from "swagger-jsdoc";
//document for API 
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Selfhelp API",
      version: "1.0.0",
      description: "API documentation for Selfhelp App",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./src/models/*.js", "./src/routers/*.js"],
};

export const specs = swaggerJsDoc(options);
