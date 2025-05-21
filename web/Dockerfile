FROM node:18-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG production
ARG genkitApiUrl
ARG socketAddr
ARG nameANDsurname
ARG email
ARG productName

ENV nameANDsurname=$nameANDsurname
ENV email=$email
ENV productName=$productName
ENV production=$production
ENV genkitApiUrl=$genkitApiUrl
ENV socketAddr=$socketAddr

RUN npm run build

FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]