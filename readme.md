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
Aneirin is far from complete. You can find what is left to be done for v1 in this section:

- [ ] Write the "Run Aneirin from source" section in the readme  

Server: 
- [x] Endpoint to receive file chunk and write it to the file
- [ ] Function to process uploaded files
- [ ] Endpoint to start processing uploaded files
- [ ] Add authentication Endpoint
- [ ] Add Playlists
- [ ] Add support for MySql/MariaDB

Admin client:
- [x] Add upload file functionality with http
- [ ] Add authentication page
- [ ] Add user management page

Player client:
- [ ] Everything so far