# Base environment
FROM node:22-alpine

# Container ke andar ka working folder
WORKDIR /app

# Pehle sirf package files copy karein (for caching optimization)
COPY package*.json ./

# Dependencies install karein
RUN npm install

# Baaki saara code copy karein
COPY . .

# Port open karein
EXPOSE 3000

# Container start hone par yeh command chalegi
CMD ["node", "final_backend/server.js"]