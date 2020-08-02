FROM node:10 as builder

WORKDIR /app

ADD . /app/

RUN npm install -g nodemon typescript && \
  yarn install
RUN yarn build

FROM node:10-slim

WORKDIR /app

ADD ./package.json /app/package.json
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN apt-get update && apt-get install -y gnupg2 \
  && apt-get install -y wget \
  && rm -rf /var/lib/apt/lists/*

RUN echo "deb http://deb.debian.org/debian jessie main\ndeb http://security.debian.org jessie/updates main" > /etc/apt/sources.list \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*\
  && chmod +x /usr/local/bin/dumb-init \
  && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
  && mkdir -p /home/pptruser/Downloads \
  && chown -R pptruser:pptruser /home/pptruser \
  && chown -R pptruser:pptruser /app

USER pptruser

RUN yarn install --production

ADD ./src/config /app/dist/config
ADD ./src/knexfile.js /app/dist/knexfile.js
ADD ./db_scripts /app/db_scripts
ADD ./.env /app/.env

COPY --from=builder /app/dist /app/dist

CMD ./node_modules/knex/bin/cli.js migrate:latest --knexfile dist/knexfile.js --env development && node dist/server.js

ENTRYPOINT ["dumb-init", "--"]
