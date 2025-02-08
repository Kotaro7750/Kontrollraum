FROM node:23 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
ENV VITE_APP_CONFIG_LOAD_MODE="REMOTE_FILE"
RUN npm install

COPY . ./
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
