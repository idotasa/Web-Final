import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import config from "./config";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "IO.Social REST API",
            version: "1.0.0",
            description: "A REST API for IO.Social",
        },
        servers: [
            {
                url: config.DOMAIN_BASE,
                description: "Environment server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT authorization header using the Bearer scheme",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "60f7e1b5b2d2b51234567890" },
                        username: { type: "string", example: "johndoe" },
                        email: { type: "string", format: "email", example: "johndoe@example.com" },
                        imgUrl: { type: "string", example: "http://example.com/profile.jpg" },
                        followers: { type: "array", items: { type: "string" } },
                        following: { type: "array", items: { type: "string" } },
                    },
                },
                Post: {
                    type: "object",
                    required: ["title", "owner"],
                    properties: {
                        _id: { type: "string", example: "60f7e1b5b2d2b50987654321" },
                        title: { type: "string", example: "My First Post" },
                        content: { type: "string", example: "Hello World!" },
                        imgUrl: { type: "string", example: "http://example.com/post.jpg" },
                        owner: { type: "string", example: "60f7e1b5b2d2b51234567890" },
                        likes: { type: "array", items: { type: "string" } },
                    },
                },
                Comment: {
                    type: "object",
                    required: ["content", "postId", "owner"],
                    properties: {
                        _id: { type: "string", example: "60f7e1b5b2d2b51122334455" },
                        content: { type: "string", example: "Great post!" },
                        postId: { type: "string", example: "60f7e1b5b2d2b50987654321" },
                        owner: { type: "string", example: "60f7e1b5b2d2b51234567890" },
                    },
                },
                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", format: "email", example: "johndoe@example.com" },
                        password: { type: "string", example: "password123" },
                    },
                },
                RegisterRequest: {
                    type: "object",
                    required: ["email", "password", "username"],
                    properties: {
                        email: { type: "string", format: "email", example: "johndoe@example.com" },
                        password: { type: "string", example: "password123" },
                        username: { type: "string", example: "johndoe" },
                        imgUrl: { type: "string", example: "http://example.com/profile.jpg" },
                    },
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "60f7e1b5b2d2b51234567890" },
                        email: { type: "string", example: "johndoe@example.com" },
                        username: { type: "string", example: "johndoe" },
                        accessToken: { type: "string", example: "eyJhbGciOiJIUzI1Ni..." },
                        refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1Ni..." },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/routes/*.ts"],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
