# FROM node:14

# # Create app directory
# WORKDIR /usr/src/app

# # Install app dependencies
# # A wildcard is used to ensure both package.json AND package-lock.json are copied
# # where available (npm@5+)
# COPY package*.json ./

# # If you are building your code for production
# # RUN npm ci --only=production
# RUN npm install


# # Bundle app source
# COPY . .
# COPY .env.production .env
# COPY prisma/.env.production prisma/.env

# RUN npm run prisma-generate

# RUN npm run build

# ENV NODE_ENV production

# EXPOSE 8080
# CMD [ "node", "dist/index.js" ]
# USER node