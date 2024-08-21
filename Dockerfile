FROM golang:1.23.0-alpine3.20 AS builder

WORKDIR /go

RUN apk add --no-cache git make
RUN pwd
RUN git clone -b master https://github.com/mattak/loglint

WORKDIR /go/loglint
CMD ["make", "buildx"]
