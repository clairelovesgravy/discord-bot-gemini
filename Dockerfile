# Use the Node.js LTS (Long Term Support) version based on Alpine Linux
FROM node:lts-alpine

# Create a directory to hold the application code inside the image
WORKDIR /usr/src/gemini

# Copy the package.json (and package-lock.json, if available) into the image
COPY package*.json ./

# Install the dependencies specified in package.json
RUN npm install

# Bundle the app source inside the Docker image
COPY . .

USER node
# The bot runs on network requests, so there's no need to expose a port

# Define the command to run your app (this should match the "start" script in package.json)
CMD ["npm", "start"]
