#!/bin/bash
cd "$(dirname "$0")"
echo "Removing old recharts..."
rm -rf node_modules/recharts
echo "Installing recharts@2.12.7..."
npm install
echo "Restarting servers..."
killall node 2>/dev/null
echo "Starting backend..."
npm run dev:backend &
echo "Starting frontend..."
npm run dev:frontend &
echo "Done! Servers are starting. Check http://localhost:5173/"
