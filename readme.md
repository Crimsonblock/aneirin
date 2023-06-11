# Aneirin
This project aspire to be a music streaming platform that is locally hosted on one's network.

The project is divided into 3 parts:
- The server.
- The admin platform where it is possible to manage the users and the library.
- The player, where users will be able to play there music from.

## How to run the project
There are two ways to use Aneirin:
- Using the container application
- Running it from the source (see later section)


### Run Aneirin from source
Section to be written

### Todos
Aneirin is far from complete. You can find what is left to be done for v1.0.0 in this section:

- [ ] Write the "Run Aneirin with docker" section in the readme
- [ ] Write the "Run Aneirin from source" section in the readme  

Server: 

- [x] Function to process uploaded files
- [ ] Admin Endpoints:
  - [x] Endpoint to receive file chunk and write it to the file
  - [x] Endpoint to start processing uploaded files
  - [ ] Endpoint to remove tracks
  - [ ] Endpoint to update tracks
  - [ ] Endpoint to remove artists and related work
  - [ ] Endpoint to update an artist
- [ ] Player endpoints:
  - [ ] Endpoint to retrieve tracks information
  - [ ] Endpoint to search for tracks/album/artists in the database
  - [ ] Endpoint to retrieve MPD
  - [ ] Endpoint to retrieve a track's segment
- [ ] Add support for MySql/MariaDB

Admin client:
- [x] Add upload file functionality with http
- [ ] Add Album management page
- [ ] Add Artists management page

Player client:
- [ ] Basic player UI
- [ ] Support for endpoints
  - [ ] To search for tracks/albums/artists
  - [ ] To start playing music
