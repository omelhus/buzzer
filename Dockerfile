FROM node:10-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV production

COPY package.json /usr/src/app/
RUN npm ci
COPY . /usr/src/app

EXPOSE 8090

CMD ["node", "./index.js"]
