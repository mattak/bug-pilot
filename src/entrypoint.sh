#!/bin/bash

set -e

cd "$(dirname "$0")"

if [ $# -lt 2 ]; then
  echo "Error: missing arguments of <bin_path> <log_file>"
  exit 1
fi

CMD=$1

echo "Hello $@"
time=$(date)

if [ -n "$GITHUB_OUTPUT" ]; then
  echo "time=$time" >> "$GITHUB_OUTPUT"
fi

env
$CMD < "$2"
