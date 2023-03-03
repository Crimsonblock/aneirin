#======= Debian =======
FROM node

#copy files
# COPY ./src/server/ /app/
COPY ./dockerfiles/entrypoint.sh /entrypoint.sh

RUN ["apt", "update"]
RUN ["apt", "install", "ffmpeg", "-y"]
WORKDIR /app
# RUN ["npm", "install"]
CMD ["/entrypoint.sh"]

#======== Alpine ========
# FROM node:alpine
# RUN ["apk", "update"]
# RUN ["apk", "install", "ffmpeg"]

# COPY ./src/* /app/
# COPY ./dockerfiles/entrypoint.sh /entrypoint.sh
# WORKDIR /app
# RUN ["npm", "install"]
# CMD ["/entrypoint.sh"]  