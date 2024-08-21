#!/bin/bash

set -ue

docker build -t loglint_builder .
docker run -v $(pwd)/bin:/go/loglint/bin -it --rm loglint_builder 
