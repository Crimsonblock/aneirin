# Debian
FROM node

# #setup tini wrapper
# ENV TINI_VERSION v0.19.0
# ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
# RUN chmod +x /tini
# ENTRYPOINT ["/tini", "--"]

#copy files
COPY ./src/* /app/
COPY ./dockerfiles/entrypoint.sh /command.sh

RUN ["apt", "update"]
RUN ["apt", "install", "ffmpeg", "-y"]
WORKDIR /app
RUN ["npm", "install"]
ENTRYPOINT ["node", "index.mjs"]

# # Alpine
# FROM node:alpine
# RUN ["apk", "update"]
# RUN ["apk", "install", "ffmpeg"]

# COPY ./src/* /app/
# COPY ./dockerfiles/entrypoint.sh /entrypoint.sh
# WORKDIR /app
# RUN ["npm", "install"]
# CMD ["/entrypoint.sh"]  