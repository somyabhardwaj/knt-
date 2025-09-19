# React development server container
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose React dev server port
EXPOSE 3000

# Environment for non-interactive container
ENV CI=true

# Start the React dev server
CMD ["npm", "start"]

