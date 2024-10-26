#!/bin/bash

key=""
url=""
interval=1

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --key=*)      key="${1#*=}";;
        --url=*)   url="${1#*=}";;
        --interval=*)   interval="${1#*=}";;
        *)            echo "Unknown option: $1" ;;
    esac
    shift
done

# Check if cron is installed using which
if which crontab > /dev/null 2>&1; then
    if which jq > /dev/null 2>&1; then
        echo "Cron is installed. Proceeding with script."

        echo "Testing configuarion"
        http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url/api/agents/$key")

        echo "HTTP Status Code: $http_code"

        # Compare the HTTP status code
        if [ "$http_code" != "200" ]; then
            echo "Invalid configuration"
            exit 1
        fi

        echo "Removing old script"
        if [ -f /usr/local/bin/watcher_agent.sh ]; then
            rm /usr/local/bin/watcher_agent.sh
        fi

        echo "Removing old cron job"
        crontab -l | grep -v '/usr/local/bin/watcher_agent.sh'  | crontab -

        echo "Downloading script"

        wget "$url/agent.sh" -O /usr/local/bin/watcher_agent.sh

        echo "Setting up script"

        crontab -l > watcher_agent

        echo "*/$interval * * * * /bin/bash /usr/local/bin/watcher_agent.sh --key=$key --url=$url 1> /dev/null 2> /var/log/watcher_agent.log" >> watcher_agent

        crontab watcher_agent
        rm watcher_agent
        echo "Cron job added successfully."
    else
        echo "jq is a requirement. Please install it."
    fi
else
  echo "Cron is a requirement. Please install it."
fi
