#!/usr/bin/env bash

source secrets.sh

echo host: ${SSH_HOST} user: ${SSH_USER}

rm -r built/prod

tar -czvf built/prod/shamu.tar.gz built/prod

scp built/prod/shamu.tar.gz ${SSH_USER}@${SSH_HOST}:shamu.tar.gz

rm built/prod/shamu.tar.gz

echo 'nvm' | ssh ${SSH_USER}@${SSH_HOST} '
    . ~/.nvm/nvm.sh;
    pm2 stop all;
    rm -r shamu;
    mkdir shamu;
    tar -xzvf shamu.tar.gz --directory shamu;
    cd shamu/built/prod;
    yarn;
    yarn start-prod;
'