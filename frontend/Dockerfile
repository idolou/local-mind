FROM node:20-slim

WORKDIR /app

# Copy package files first to leverage cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite port
EXPOSE 3000

# Start Vite server handling 0.0.0.0 binding
CMD ["npm", "run", "dev", "--", "--host"]
