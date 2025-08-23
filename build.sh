#!/bin/bash

# DEV
docker build --no-cache -t zoryon/noxchess-client:dev --build-arg BUILD_ENV=development .

# PRODUCTION
# docker build --no-cache -t zoryon/noxchess-client:production --build-arg BUILD_ENV=production .
