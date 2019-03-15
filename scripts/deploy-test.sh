#!/usr/bin/env bash

# https://zaiste.net/a_few_ways_to_execute_commands_remotely_using_ssh/

source secrets.sh

echo host: ${SSH_HOST_TEST} user: ${SSH_USER_TEST}

tar -czvf built/shamu.tar.gz built

scp built/shamu.tar.gz ${SSH_USER_TEST}@${SSH_HOST_TEST}:shamu.tar.gz

rm built/shamu.tar.gz

echo 'nvm' | ssh ${SSH_USER_TEST}@${SSH_HOST_TEST} '
    . ~/.nvm/nvm.sh;
    pm2 stop all;
    rm -r shamu;
    mkdir shamu;
    tar -xzvf shamu.tar.gz --directory shamu;
    cd shamu/built;
    yarn --prod;
    yarn start-prod;
'
