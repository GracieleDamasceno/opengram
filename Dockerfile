FROM node:alpine
WORKDIR /opengram
COPY ./package.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]