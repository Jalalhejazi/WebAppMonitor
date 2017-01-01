FROM node:4.7.0

RUN npm i -gq nodemon 

COPY . /srv/www/app
WORKDIR /srv/www/app

RUN npm i -q

CMD nodemon