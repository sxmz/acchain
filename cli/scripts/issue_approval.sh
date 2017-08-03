#!/bin/bash

readonly PROGRAM_DIR=$(dirname $0)
readonly CLI=$PROGRAM_DIR/../bin/acchain-cli

secrets=(
)

if [ $# -lt 1 ]; then
        echo "Please input the approval transaction id"
        exit
fi

for secret in "${secrets[@]}"
do  
    $CLI -P 5000 submitapproval -e "$secret" -t 2 -v $1
done  
