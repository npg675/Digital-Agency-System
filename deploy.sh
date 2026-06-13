#!/bin/bash

cd /root/Digital-Agency-System

git pull origin main

docker compose down

docker compose up -d --build
