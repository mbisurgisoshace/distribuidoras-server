FROM node:10

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init

WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN echo "deb http://deb.debian.org/debian jessie main\ndeb http://security.debian.org jessie/updates main" > /etc/apt/sources.list && \
  apt-get update && \
  apt-get -qy install --no-install-recommends netcat wget && \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont --no-install-recommends && \
  apt-get -y autoremove && \
  apt-get -y clean && \
  rm -rf /var/lib/apt/lists/* && \
  rm -rf /tmp/* && \
  npm install -g nodemon typescript && \
  chmod +x /usr/local/bin/dumb-init

ENTRYPOINT ["dumb-init", "--"]

ADD package.json /app/

RUN yarn
