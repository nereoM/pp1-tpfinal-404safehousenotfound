# Dockerfile para el frontend
FROM node:18

WORKDIR /client
COPY client /client

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]