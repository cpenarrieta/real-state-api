#!/bin/bash

echo What should the version be?
read VERSION

docker build -t cpenarrieta/realtor-app:$VERSION . --platform linux/amd64
docker push cpenarrieta/realtor-app:$VERSION
ssh root@159.89.138.157 "docker pull cpenarrieta/realtor-app:$VERSION && docker tag cpenarrieta/realtor-app:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"