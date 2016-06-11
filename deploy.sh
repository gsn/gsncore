#!/bin/sh

cp gsncore-basic.js ./src
cp gsncore-basic.min.js ./src
cp gsncore.js ./src
cp gsncore.min.js ./src
aws s3 sync "./src" "s3://brick-web/ds/$1/script/gsncore/latest"