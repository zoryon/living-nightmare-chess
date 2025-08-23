#!/bin/bash

# DEV
docker run --env-file .env -p 3000:3000 zoryon/noxchess-client:dev

# PRODUCTION
# docker run --env-file .env -p 3000:3000 zoryon/noxchess-client:1.0