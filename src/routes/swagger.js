import swaggerJsDoc from 'swagger-jsdoc'
import { serve, setup } from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi vendor ecommerce API',
      version: '1.0.0',
      description: 'API for Multi vendor ecommerce application',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['src/routes/auth/authRoutes.js'],
}

const swaggerSpec = swaggerJsDoc(options)

export const swaggerDocs = (app, port) => {
  app.use('/api-docs', serve, setup(swaggerSpec))

  // eslint-disable-next-line no-undef
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`)
}
