# Step 1: Use a lightweight Node.js image
FROM node:18-slim

# Step 2: Create a directory for your app inside the container
WORKDIR /app

# Step 3: Copy package files and install dependencies
# (This is done first to cache layers for faster builds)
COPY package*.json ./
RUN npm install --production

# Step 4: Copy your server.js and the public folder
COPY . .

# Step 5: Tell Docker which port your app uses
EXPOSE 3000

# Step 6: Command to run your app
CMD ["node", "server.js"]