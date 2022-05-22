FROM node:16-alpine
WORKDIR /opengram
COPY ./package.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev"]