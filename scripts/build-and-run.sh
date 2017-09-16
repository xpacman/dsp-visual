#!/usr/bin/env bash

npm run build && (cd ./build/; http-server)
