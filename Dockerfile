# Use the official Node.js image
FROM node:22

# Set the working directory
WORKDIR /app

# Clone the repository and install dependencies
RUN git clone https://github.com/Cyteon/the-watcher.git . && \
    npm install

# Copy the update-and-run script and make it executable
COPY update-and-run.sh /usr/local/bin/update-and-run.sh
RUN chmod +x /usr/local/bin/update-and-run.sh

EXPOSE 3000

# Set the default command to execute the update-and-run script
CMD ["/usr/local/bin/update-and-run.sh"]
